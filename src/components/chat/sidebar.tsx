import React from "react";
import { Scale, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarSessionList } from "./sidebar-session-list";
import { SidebarUserProfile } from "./sidebar-user-profile";

interface SidebarProps {
  threadId: string;
  setThreadId: (id: string) => void;
  onNewSession: () => void;
  session: any;
  onSignOut: () => void;
}

export function Sidebar({
  threadId,
  setThreadId,
  onNewSession,
  session,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-850 flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <span className="font-bold text-zinc-950 dark:text-white tracking-tight">Vectorless-RAG</span>
          </div>
        </div>
        
        <div className="p-3">
          <Button 
            onClick={onNewSession}
            className="w-full bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex justify-start space-x-2 text-xs"
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span>New Session</span>
          </Button>
        </div>

        <SidebarSessionList
          threadId={threadId}
          setThreadId={setThreadId}
        />
      </div>

      {/* User profile footer */}
      <SidebarUserProfile
        session={session}
        onSignOut={onSignOut}
      />
    </aside>
  );
}
