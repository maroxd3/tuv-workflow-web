import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { C } from "./styles/theme";
import { useDb } from "./hooks/useDb";
import { useToasts } from "./hooks/useToasts";
import { useIsMobile } from "./hooks/useIsMobile";
import { Sidebar } from "./layout/Sidebar";
import { Topbar } from "./layout/Topbar";
import { useAuth } from "./auth/AuthContext";
import { LoginView } from "./views/LoginView";
const TagesplanView = lazy(() => import("./views/TagesplanView").then(m => ({ default: m.TagesplanView })));
const FahrzeugeView = lazy(() => import("./views/FahrzeugeView").then(m => ({ default: m.FahrzeugeView })));
const StatistikView = lazy(() => import("./views/StatistikView").then(m => ({ default: m.StatistikView })));
const BerichteView = lazy(() => import("./views/BerichteView").then(m => ({ default: m.BerichteView })));

function ViewFallback() {
  return (
    <div className="flex min-h-[220px] items-center justify-center text-[13px] font-semibold text-t3">
      Ansicht wird geladen...
    </div>
  );
}

/* Auth-Gate: entscheidet VOR dem App-Shell-Mount, ob ein Login noetig ist.
   Wichtig: useDb (inkl. 5-Sek-Polling) lebt in AppShell und wird erst
   gemountet, wenn ein Benutzer feststeht — sonst haemmert das Polling
   401er gegen die API, solange der Login-Screen offen ist. */
export default function App() {
  const auth = useAuth();

  // Neutraler Splash, solange GET /api/auth/me laeuft.
  if (auth.status === "laden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg font-sans">
        <div className="h-10 w-10 animate-[spin_0.8s_linear_infinite] rounded-full border-[3px] border-line border-t-cyan" />
      </div>
    );
  }

  if (auth.status !== "eingeloggt" || !auth.benutzer) {
    return <LoginView />;
  }

  return <AppShell />;
}

function AppShell() {
  const isMobile = useIsMobile();
  const [view, setView] = useState("tagesplan");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { add: toast } = useToasts();
  const S = useDb();

  /* Auf Mobil-Geräten Sidebar nach einem View-Wechsel automatisch schließen,
     damit der Content sofort sichtbar ist. */
  const handleSetView = v => {
    setView(v);
    if (isMobile) setSidebarOpen(false);
  };

  const SIDEBAR_W = 240;

  // Fehler-Screen wenn die API/DB nicht erreichbar ist (Stack down, falsches
  // VITE_API_BASE_URL, MariaDB-Crash). Vorher hing der User in einem ewigen
  // "Daten werden geladen..."-Spinner. Jetzt: klare Botschaft, Retry-Knopf.
  if (S.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg p-6 font-sans">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(240,69,90,0.45)] bg-[rgba(240,69,90,0.10)] text-[28px] font-bold text-red-l">!</div>
        <div className="text-[20px] font-bold text-t1">
          Verbindung zur Datenbank fehlgeschlagen
        </div>
        <div className="max-w-[440px] text-center text-[14px] leading-[1.55] text-t3">
          Die App konnte den Express-API-Server nicht erreichen. Mögliche Ursachen:
          Server-PC ist aus, Docker-Stack steht still, oder VITE_API_BASE_URL zeigt ins Leere.
        </div>
        <div className="max-w-[520px] break-all rounded-md border border-line bg-surface px-3 py-2 font-mono text-[11px] text-t4">{S.error}</div>
        <button
          onClick={() => S.refresh?.()}
          className="cursor-pointer rounded-lg border-none bg-cyan px-[22px] py-2.5 font-sans text-[13px] font-bold text-[#0a0a14]"
        >Erneut versuchen</button>
      </div>
    );
  }

  if (!S.ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg font-sans">
        <div className="h-10 w-10 animate-[spin_0.8s_linear_infinite] rounded-full border-[3px] border-line border-t-cyan" />
        <div className="text-[14px] font-medium text-t3">Daten werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg font-sans text-t1">
      <Toaster richColors position="bottom-right" toastOptions={{ style: { fontFamily: C.sans } }} />

      {/* Mobile-Backdrop hinter geöffneter Sidebar */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[55] bg-[rgba(15,15,26,0.55)] backdrop-blur-[4px]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -SIDEBAR_W, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -SIDEBAR_W, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 z-[60] w-60"
          >
            <Sidebar
              view={view} setView={handleSetView}
              fahrzeuge={S.fahrzeuge} termine={S.termine}
              resetAllData={S.resetAllData}
              loadDemoData={S.loadDemoData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — auf Mobil immer ohne Margin (Sidebar overlayet),
         auf Desktop schiebt die Sidebar den Content. */}
      <motion.div
        animate={{ marginLeft: sidebarOpen && !isMobile ? SIDEBAR_W : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="flex min-h-screen min-w-0 flex-1 flex-col"
      >
        <Topbar view={view} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)} />

        <div className="flex-1 px-8 py-6 max-[768px]:px-3.5 max-[768px]:py-3">
          <AnimatePresence mode="wait">
            <motion.div key={view}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <Suspense fallback={<ViewFallback />}>
                {view === "tagesplan" && (
                  <TagesplanView
                    fahrzeuge={S.fahrzeuge} halter={S.halter} termine={S.termine}
                    addTermin={S.addTermin} updTermin={S.updTermin}
                    updTerminStatus={S.updTerminStatus} delTermin={S.delTermin}
                    addMangel={S.addMangel} delMangel={S.delMangel}
                    toast={toast}
                  />
                )}
                {view === "fahrzeuge" && (
                  <FahrzeugeView
                    fahrzeuge={S.fahrzeuge} halter={S.halter} termine={S.termine}
                    addFahrzeugMitHalter={S.addFahrzeugMitHalter}
                    updFahrzeug={S.updFahrzeug} updHalter={S.updHalter}
                    delFahrzeug={S.delFahrzeug}
                    toast={toast}
                  />
                )}
                {view === "statistik" && <StatistikView termine={S.termine} fahrzeuge={S.fahrzeuge} />}
                {view === "berichte" && <BerichteView termine={S.termine} fahrzeuge={S.fahrzeuge} halter={S.halter} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
