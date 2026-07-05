import React from "react";
import { Scale, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarSessionList } from "./sidebar-session-list";
import { SidebarUserProfile } from "./sidebar-user-profile";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SidebarProps {
  threadId: string;
  setThreadId: (id: string) => void;
  sessionsList?: {id: string, title?: string}[];
  onNewSession: () => void;
  session: any;
  onSignOut: () => void;
  onSignInClick: () => void;
  onSettingsClick: () => void;
  className?: string;
}

export function Sidebar({
  threadId,
  setThreadId,
  sessionsList = [],
  onNewSession,
  session,
  onSignOut,
  onSignInClick,
  onSettingsClick,
  className,
}: SidebarProps) {
  return (
    <aside className={cn("w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between", className)}>
      <div>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-500 animate-pulse" />
            <span className="font-bold text-zinc-950 dark:text-white tracking-tight">Legal-Assist Agent</span>
          </div>
        </div>
        
        <div className="p-3">
          <motion.div
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
          >
            <Button 
              onClick={onNewSession}
              className="w-full bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex justify-start space-x-2 text-xs relative overflow-hidden group shadow-xs"
            >
              <motion.div
                variants={{
                  hover: { rotate: 90, scale: 1.1 }
                }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 15 }}
              >
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              </motion.div>
              <span>New Session</span>
            </Button>
          </motion.div>
        </div>

        <SidebarSessionList
          threadId={threadId}
          setThreadId={setThreadId}
          sessionsList={sessionsList}
        />
      </div>

      {/* Guest user call-to-action banner with motion */}
      {session?.user?.is_anonymous && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-4 my-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950/20 rounded-xl space-y-1.5"
        >
          <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
            Your history is saved locally. Create an account to sync it across devices permanently.
          </p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSignInClick}
            className="w-full py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer text-center block shadow-xs"
          >
            Sign Up to Sync
          </motion.button>
        </motion.div>
      )}

      {/* User profile footer */}
      <SidebarUserProfile
        session={session}
        onSignOut={onSignOut}
        onSignInClick={onSignInClick}
        onSettingsClick={onSettingsClick}
      />
    </aside>
  );
}

