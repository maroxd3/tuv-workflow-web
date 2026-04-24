import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { C, GLOBAL_CSS } from "./styles/theme";
import { useStore } from "./hooks/useStore";
import { useToasts } from "./hooks/useToasts";
import { Sidebar } from "./layout/Sidebar";
import { Topbar } from "./layout/Topbar";
import { TagesplanView } from "./views/TagesplanView";
import { FahrzeugeView } from "./views/FahrzeugeView";
import { StatistikView } from "./views/StatistikView";
import { BerichteView } from "./views/BerichteView";

export default function App() {
  const [view, setView] = useState("tagesplan");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { add: toast } = useToasts();
  const S = useStore();

  const SIDEBAR_W = 240;

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
              view={view} setView={setView}
              fahrzeuge={S.fahrzeuge} termine={S.termine}
              resetAll={S.resetAll}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        animate={{ marginLeft: sidebarOpen ? SIDEBAR_W : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Topbar view={view} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)} />

        <div style={{ padding: "24px 32px", flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div key={view}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }}>
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
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
