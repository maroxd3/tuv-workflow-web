import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { C, GLOBAL_CSS } from "./styles/theme";
import { useStoreCompat as useStore } from "./hooks/useStoreCompat";
import { useToasts } from "./hooks/useToasts";
import { useIsMobile } from "./hooks/useIsMobile";
import { Sidebar } from "./layout/Sidebar";
import { Topbar } from "./layout/Topbar";
const TagesplanView = lazy(() => import("./views/TagesplanView").then(m => ({ default: m.TagesplanView })));
const FahrzeugeView = lazy(() => import("./views/FahrzeugeView").then(m => ({ default: m.FahrzeugeView })));
const StatistikView = lazy(() => import("./views/StatistikView").then(m => ({ default: m.StatistikView })));
const BerichteView = lazy(() => import("./views/BerichteView").then(m => ({ default: m.BerichteView })));

function ViewFallback() {
  return (
    <div style={{
      minHeight: 220,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.t3,
      fontSize: 13,
      fontWeight: 600,
    }}>
      Ansicht wird geladen...
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [view, setView] = useState("tagesplan");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { add: toast } = useToasts();
  const S = useStore();

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
      <div style={{
        minHeight: "100vh", background: C.bg, fontFamily: C.sans,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 20, padding: 24,
      }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(240,69,90,0.10)", border: `1px solid rgba(240,69,90,0.45)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.redL, fontSize: 28, fontWeight: 700,
        }}>!</div>
        <div style={{ color: C.t1, fontSize: 20, fontWeight: 700 }}>
          Verbindung zur Datenbank fehlgeschlagen
        </div>
        <div style={{ color: C.t3, fontSize: 14, maxWidth: 440, textAlign: "center", lineHeight: 1.55 }}>
          Die App konnte den Express-API-Server nicht erreichen. Mögliche Ursachen:
          Server-PC ist aus, Docker-Stack steht still, oder VITE_API_BASE_URL zeigt ins Leere.
        </div>
        <div style={{
          fontSize: 11, fontFamily: C.mono, color: C.t4,
          background: C.surface, padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.line}`,
          maxWidth: 520, wordBreak: "break-all",
        }}>{S.error}</div>
        <button
          onClick={() => S.refresh?.()}
          style={{
            background: C.cyan, color: "#0a0a14", border: "none",
            padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: C.sans,
          }}
        >Erneut versuchen</button>
      </div>
    );
  }

  if (!S.ready) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg, fontFamily: C.sans,
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
      }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{
          width: 40, height: 40, border: `3px solid ${C.line}`, borderTopColor: C.cyan,
          borderRadius: "50%", animation: "spin 0.8s linear infinite",
        }} />
        <div style={{ color: C.t3, fontSize: 14, fontWeight: 500 }}>Daten werden geladen...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.sans, color: C.t1, display: "flex" }}>
      <style>{GLOBAL_CSS}</style>
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
            style={{
              position: "fixed", inset: 0, zIndex: 55,
              background: "rgba(15,15,26,0.55)",
              backdropFilter: "blur(4px)",
            }}
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
            style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 60, width: SIDEBAR_W }}
          >
            <Sidebar
              view={view} setView={handleSetView}
              fahrzeuge={S.fahrzeuge} termine={S.termine}
              resetAll={S.resetAll}
              loadDemo={S.loadDemo}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — auf Mobil immer ohne Margin (Sidebar overlayet),
         auf Desktop schiebt die Sidebar den Content. */}
      <motion.div
        animate={{ marginLeft: sidebarOpen && !isMobile ? SIDEBAR_W : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: 0 }}
      >
        <Topbar view={view} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)} />

        <div className="pad-mobile" style={{ padding: "24px 32px", flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div key={view}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <Suspense fallback={<ViewFallback />}>
                {view === "tagesplan" && (
                  <TagesplanView
                    fahrzeuge={S.fahrzeuge} termine={S.termine}
                    addTr={S.addTr} updTr={S.updTr} delTr={S.delTr}
                    addMangel={S.addMangel} delMangel={S.delMangel}
                    toast={toast}
                  />
                )}
                {view === "fahrzeuge" && (
                  <FahrzeugeView
                    fahrzeuge={S.fahrzeuge} termine={S.termine}
                    addFz={S.addFz} updFz={S.updFz} delFz={S.delFz}
                    toast={toast}
                  />
                )}
                {view === "statistik" && <StatistikView termine={S.termine} fahrzeuge={S.fahrzeuge} />}
                {view === "berichte" && <BerichteView termine={S.termine} fahrzeuge={S.fahrzeuge} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
