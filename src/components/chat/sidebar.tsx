import React from "react";
import { Scale, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarSessionList } from "./sidebar-session-list";
import { SidebarUserProfile } from "./sidebar-user-profile";

interface SidebarProps {
  threadId: string;
  setThreadId: (id: string) => void;
  sessionsList?: {id: string, title?: string}[];
  onNewSession: () => void;
  session: any;
  onSignOut: () => void;
  onSignInClick: () => void;
}

export function Sidebar({
  threadId,
  setThreadId,
  sessionsList = [],
  onNewSession,
  session,
  onSignOut,
  onSignInClick,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <span className="font-bold text-zinc-950 dark:text-white tracking-tight">Legal-Assist Agent</span>
          </div>
        </div>
        
        <div className="p-3">
          <Button 
            onClick={onNewSession}
            className="w-full bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex justify-start space-x-2 text-xs"
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span>New Session</span>
          </Button>
        </div>

        <SidebarSessionList
          threadId={threadId}
          setThreadId={setThreadId}
          sessionsList={sessionsList}
        />
      </div>

      {/* Guest user call-to-action banner */}
      {session?.user?.is_anonymous && (
        <div className="mx-4 my-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950/20 rounded-xl space-y-1.5">
          <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
            Your history is saved locally. Create an account to sync it across devices permanently.
          </p>
          <button 
            onClick={onSignInClick}
            className="w-full py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer text-center"
          >
            Sign Up to Sync
          </button>
        </div>
      )}

      {/* User profile footer */}
      <SidebarUserProfile
        session={session}
        onSignOut={onSignOut}
        onSignInClick={onSignInClick}
      />
    </aside>
  );
}
