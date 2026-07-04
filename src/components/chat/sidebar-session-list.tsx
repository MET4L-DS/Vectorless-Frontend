import React from "react";
import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarSessionListProps {
  threadId: string;
  setThreadId: (id: string) => void;
  sessionsList?: {id: string, title?: string}[];
}

export function SidebarSessionList({
  threadId,
  setThreadId,
  sessionsList = [],
}: SidebarSessionListProps) {
  // Deduplicate sessions by ID in case of overlaps
  const uniqueSessions = Array.from(new Map(sessionsList.map(item => [item.id, item])).values());

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <ScrollArea className="flex-1 px-3">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-1 text-xs mt-2"
      >
        {uniqueSessions.map((session) => (
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            key={session.id}
            onClick={() => {
              console.log(`[sidebar-session-list.tsx] Session clicked. Switching thread to: "${session.id}"`);
              setThreadId(session.id);
            }}
            className={`w-full text-left p-2.5 rounded-lg flex items-center space-x-2 transition-colors ${
              threadId === session.id 
                ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/60 text-emerald-950 dark:text-white" 
                : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span 
                key={session.title || session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="truncate block"
              >
                {session.title || `Session ${session.id.slice(-4)}`}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        ))}
      </motion.div>
    </ScrollArea>
  );
}

