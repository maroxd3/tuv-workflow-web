/**
 * Flow 4 — WF-01 (kein "Bestanden" bei blockierendem Mangel) durch die UI.
 *
 * Drei Verdrahtungen:
 *  a) Client-Guard: offener EM-Mangel → "Bestanden"-Button im MaengelModal
 *     ist gesperrt (disabled + §29-Hinweis), kein API-Call.
 *  b) Server-Guard: Client kennt keinen blockierenden Mangel, Server lehnt
 *     mit {ok:false, reason} ab → Fehlertoast, Status rollt sichtbar zurück.
 *  c) Gegenprobe: {ok:true} → Status wechselt sichtbar auf "Bestanden".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../db/apiClient", () => import("./apiClientMock.js"));
vi.mock("sonner", () => {
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.error = vi.fn();
  toastFn.warning = vi.fn();
  return { toast: toastFn, Toaster: () => null };
});

import { toast } from "sonner";
import * as api from "../../db/apiClient";
import { primeApi, renderApp, BENUTZER, TERMIN_ID, terminFixture, mangelEmFixture } from "./testUtils";

const apiMock = vi.mocked(api);

beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.removeItem(api.TOKEN_STORAGE_KEY);
});

/** Die Termin-Zeile im Tagesplan (motion.div mit Kontextmenü-Cursor). */
function terminRow() {
  const row = screen.getByText("H-AB 1234").closest(".cursor-context-menu");
  expect(row).not.toBeNull();
  return row;
}

/** App als Prüfer rendern und das MaengelModal des Fixture-Termins öffnen. */
async function openMaengelModal(user) {
  await user.click(
    // 10s statt 3s: unter paralleler Worker-Last (CI, voller Suite-Lauf)
    // braucht der erste App-Render mit framer-motion gelegentlich laenger.
    await screen.findByRole("button", { name: "Mängel erfassen" }, { timeout: 10_000 }),
  );
  return await screen.findByRole("dialog", { name: "Mängelerfassung" });
}

describe("Flow: WF-01 Status-Guard", () => {
  it("a) offener EM-Mangel: 'Bestanden' ist gesperrt, kein updTerminStatus-Call", async () => {
    primeApi(apiMock, {
      benutzer: BENUTZER.pruefer,
      termine: [terminFixture({ statusCode: "In Prüfung", maengel: [mangelEmFixture()] })],
    });
    const user = userEvent.setup();
    renderApp();
    const dialog = await openMaengelModal(user);

    // Sichtbarer Hinweis + gesperrter Button mit §29-Begründung
    expect(
      within(dialog).getByText(/Hauptmangel vorhanden — nicht bestanden/),
    ).toBeInTheDocument();
    const bestandenBtn = within(dialog).getByRole("button", { name: "Bestanden" });
    expect(bestandenBtn).toBeDisabled();
    expect(bestandenBtn).toHaveAttribute("title", expect.stringContaining("§ 29 StVZO"));

    await user.click(bestandenBtn); // disabled → darf nichts auslösen
    expect(apiMock.updTerminStatus).not.toHaveBeenCalled();
    expect(within(terminRow()).getByText("In Prüfung")).toBeInTheDocument();
  }, 15000);

  it("b) Server lehnt ab ({ok:false}): Fehlertoast, Status bleibt 'In Prüfung'", async () => {
    const reason = "Bestanden nicht möglich — erheblicher oder gefährlicher Mangel vorhanden";
    primeApi(apiMock, {
      benutzer: BENUTZER.pruefer,
      termine: [terminFixture({ statusCode: "In Prüfung" })], // Client sieht keine Mängel
    });
    apiMock.updTerminStatus.mockResolvedValue({ ok: false, reason });
    const user = userEvent.setup();
    renderApp();
    const dialog = await openMaengelModal(user);

    await user.click(within(dialog).getByRole("button", { name: "Bestanden" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(reason));
    expect(apiMock.updTerminStatus).toHaveBeenCalledWith(TERMIN_ID, "Bestanden");
    // Optimistic Update wurde zurückgerollt — Zeile zeigt weiterhin den alten Status
    expect(within(terminRow()).getByText("In Prüfung")).toBeInTheDocument();
    expect(within(terminRow()).queryByText("Bestanden")).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  }, 15000);

  it("c) Gegenprobe {ok:true}: Status wechselt sichtbar auf 'Bestanden'", async () => {
    const termineData = [terminFixture({ statusCode: "In Prüfung" })];
    primeApi(apiMock, { benutzer: BENUTZER.pruefer, termine: termineData });
    apiMock.updTerminStatus.mockImplementation(async (id, status) => {
      const termin = { ...termineData[0], statusCode: status };
      termineData[0] = termin; // Poll-Refresh bleibt konsistent
      return { ok: true, termin };
    });
    const user = userEvent.setup();
    renderApp();
    const dialog = await openMaengelModal(user);

    await user.click(within(dialog).getByRole("button", { name: "Bestanden" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Status: Bestanden"));
    expect(apiMock.updTerminStatus).toHaveBeenCalledWith(TERMIN_ID, "Bestanden");
    // Zeile im Tagesplan zeigt den neuen Status
    expect(await within(terminRow()).findByText("Bestanden")).toBeInTheDocument();
    expect(within(terminRow()).queryByText("In Prüfung")).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  }, 15000);
});
