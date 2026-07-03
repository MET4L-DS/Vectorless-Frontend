import React from "react";
import { Trash2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ChatHeaderProps {
  threadId: string;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  mounted: boolean;
  onClearChat: () => void;
}

export function ChatHeader({
  threadId,
  theme,
  setTheme,
  mounted,
  onClearChat,
}: ChatHeaderProps) {
  return (
    <header className="h-14 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-850 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
          Thread: <span className="text-zinc-950 dark:text-zinc-200 normal-case font-mono">{threadId}</span>
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Dynamic Light/Dark Mode Toggle with slide/rotate transitions */}
        {mounted && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const targetTheme = theme === "dark" ? "light" : "dark";
              console.log(`[chat-header.tsx] Theme toggle clicked. Switching from "${theme}" to "${targetTheme}"`);
              setTheme(targetTheme);
            }}
            className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 overflow-hidden relative"
            title="Toggle Theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -15, opacity: 0, rotate: -45 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 15, opacity: 0, rotate: 45 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
              </motion.div>
            </AnimatePresence>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onClearChat}
          className="text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Clear Chat
        </Button>
      </div>
    </header>
  );
}
