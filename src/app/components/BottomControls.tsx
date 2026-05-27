import { motion } from "motion/react";
import { useState } from "react";
import { Sparkles, Clock } from "lucide-react";
import { Switch } from "@mui/material";

interface BottomControlsProps {
  aiMode: boolean;
  setAiMode: (mode: boolean) => void;
}

export function BottomControls({ aiMode, setAiMode }: BottomControlsProps) {
  const [tokens, setTokens] = useState(42);

  const handlePostpone = () => {
    // Logic for postponing tasks
    console.log("일정 미루기");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-5xl mx-auto px-8 py-8"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-br from-rose-50/40 via-orange-50/30 to-amber-50/40 backdrop-blur-sm rounded-3xl p-6 border border-rose-100/50 shadow-lg relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-200/10 to-orange-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-rose-200/10 to-pink-200/10 rounded-full blur-3xl" />
        {/* Token Display */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-muted-foreground">보유 토큰</p>
            <p className="font-mono">{tokens}</p>
          </div>
        </div>

        {/* Postpone Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePostpone}
          className="px-6 py-3 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 relative z-10"
        >
          <Clock className="w-5 h-5" />
          <span>일정 미루기</span>
        </motion.button>

        {/* AI Focus Toggle */}
        <div className="flex items-center gap-3 bg-background/50 rounded-full px-4 py-2 border border-border/50 relative z-10">
          <span className="text-muted-foreground">AI 집중 모드</span>
          <Switch
            checked={aiMode}
            onChange={(e) => setAiMode(e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "var(--primary)",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--primary)",
              },
            }}
          />
        </div>
      </div>

      {/* AI Mode Active Indicator */}
      {aiMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 bg-primary/10 backdrop-blur-sm rounded-2xl border border-primary/20 text-center"
        >
          <p className="text-primary">
            AI 집중 모드가 활성화되었습니다. 방해 요소가 차단됩니다.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
