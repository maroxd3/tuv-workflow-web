import { useState } from "react";
import { Shield, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

/* Eingabefeld in der dunklen Sidebar-Palette — bewusst nicht Inp
   (bg-surface/weiss), sondern konsistent zum sb-Karten-Hintergrund. */
const LOGIN_FIELD_CLS = [
  "w-full rounded-lg border px-3 py-[9px] text-[13px] outline-none",
  "border-sb-line bg-[rgba(255,255,255,0.06)] text-sb-t1",
  "placeholder:text-sb-t3 transition-[border-color] duration-150 focus:border-blue-l",
].join(" ");

const LOGIN_LABEL_CLS = "text-[10px] font-bold uppercase tracking-[0.1em] text-sb-t2";

export function LoginView() {
  const { login } = useAuth();
  const [kuerzel, setKuerzel] = useState("");
  const [passwort, setPasswort] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Submit per Enter kommt gratis: <form onSubmit> + type="submit"-Button.
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await login(kuerzel.trim(), passwort);
    } catch (err) {
      setError(err?.message || "Anmeldung fehlgeschlagen");
      setBusy(false);
    }
    // Bei Erfolg unmountet die App diesen Screen — kein setBusy(false) noetig.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,var(--color-sb)_0%,#110E30_100%)] p-6 font-sans">
      <div className="w-full max-w-[380px] rounded-2xl border border-sb-line bg-[rgba(255,255,255,0.04)] px-8 pt-9 pb-8 shadow-[0_12px_48px_rgba(0,0,0,0.45)]">

        {/* Logo + Titel */}
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] shadow-[0_4px_24px_rgba(99,102,241,0.55)]">
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <div className="text-[18px] font-bold tracking-[-0.01em] text-sb-t1">TÜV Prüfstelle Pro</div>
            <div className="mt-1 text-[10px] tracking-[0.14em] text-sb-t3">ANMELDUNG · VERWALTUNGSSYSTEM</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-[5px]">
            <label htmlFor="login-kuerzel" className={LOGIN_LABEL_CLS}>Kürzel</label>
            <input
              id="login-kuerzel"
              value={kuerzel}
              onChange={e => setKuerzel(e.target.value)}
              placeholder="z. B. MM"
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className={`${LOGIN_FIELD_CLS} font-mono`}
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label htmlFor="login-passwort" className={LOGIN_LABEL_CLS}>Passwort</label>
            <input
              id="login-passwort"
              value={passwort}
              onChange={e => setPasswort(e.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={LOGIN_FIELD_CLS}
            />
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] px-3 py-2.5 text-[12px] font-medium text-[#FCA5A5]">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className={[
              "mt-1 flex items-center justify-center gap-2 rounded-[9px] border-none px-5 py-[10px]",
              "bg-[linear-gradient(135deg,#2563EB,#3B82F6)] font-sans text-[13px] font-semibold text-white",
              "shadow-[0_2px_8px_rgba(37,99,235,0.28)] transition-all duration-[0.18s]",
              busy
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:-translate-y-px hover:brightness-110 hover:shadow-[0_6px_24px_rgba(79,70,229,0.35)] active:translate-y-0",
            ].join(" ")}
          >
            {busy
              ? (
                <>
                  <span className="h-3.5 w-3.5 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(255,255,255,0.35)] border-t-white" />
                  Anmeldung läuft...
                </>
              )
              : <><LogIn size={14} />Anmelden</>}
          </button>
        </form>

        <div className="mt-6 border-t border-sb-line pt-4 text-center text-[10px] leading-[1.6] text-sb-t3">
          Zugangsdaten erhalten Sie von der Prüfstellenleitung.
        </div>
      </div>
    </div>
  );
}
