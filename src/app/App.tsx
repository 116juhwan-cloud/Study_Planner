import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Header } from "./components/Header";
import { QuoteSection } from "./components/QuoteSection";
import { CalendarView } from "./components/CalendarView";
import { BottomControls } from "./components/BottomControls";
import { FaceMeshTracker } from "./components/FaceMeshTracker";

export default function App() {
  const [aiMode, setAiMode] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 overflow-y-auto relative flex">
      {/* Ambient background decorations */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-20 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-gradient-to-br from-teal-200/20 to-green-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-gradient-to-br from-rose-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
      </div>

      <div className={`flex-1 flex flex-col py-8 gap-8 relative z-10 transition-all duration-500 ease-in-out ${aiMode ? "lg:mr-[400px]" : ""}`}>
        <Header />
        <QuoteSection />
        <CalendarView />
        <BottomControls aiMode={aiMode} setAiMode={setAiMode} />
      </div>

      {/* AI Focus Panel Drawer */}
      <AnimatePresence>
        {aiMode && (
          <FaceMeshTracker onClose={() => setAiMode(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}