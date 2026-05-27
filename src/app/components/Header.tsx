import { motion } from "motion/react";
import { Settings, Bell, User } from "lucide-react";

export function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-5xl mx-auto px-8 py-6 flex justify-end items-center gap-3"
    >
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 flex items-center justify-center shadow-lg border border-blue-200/50 backdrop-blur-sm transition-all"
      >
        <Settings className="w-5 h-5 text-blue-600" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 hover:from-cyan-200 hover:to-cyan-300 flex items-center justify-center shadow-lg border border-cyan-200/50 backdrop-blur-sm transition-all"
      >
        <Bell className="w-5 h-5 text-cyan-600" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 hover:from-sky-200 hover:to-sky-300 flex items-center justify-center shadow-lg border border-sky-200/50 backdrop-blur-sm transition-all"
      >
        <User className="w-5 h-5 text-sky-600" />
      </motion.button>
    </motion.div>
  );
}
