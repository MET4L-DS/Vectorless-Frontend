import React from "react";
import { motion } from "framer-motion";

export function GlowCursor() {
  return (
    <span className="relative inline-block align-middle ml-1">
      {/* Trailing underline glow (Comet tail effect) */}
      <motion.span
        className="absolute bottom-0 right-full w-16 h-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(to left, rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0))"
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Main cursor head */}
      <motion.span
        className="inline-block h-4 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-full"
        animate={{
          opacity: [0.2, 1, 0.2],
          boxShadow: [
            "0 0 4px rgba(16, 185, 129, 0.2)",
            "0 0 12px rgba(16, 185, 129, 0.8)",
            "0 0 4px rgba(16, 185, 129, 0.2)",
          ],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </span>
  );
}
