import React from "react";
import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarSessionListProps {
  threadId: string;
  setThreadId: (id: string) => void;
}

export function SidebarSessionList({
  threadId,
  setThreadId,
}: SidebarSessionListProps) {
  return (
    <ScrollArea className="flex-1 px-3">
      <div className="space-y-1 text-xs mt-2">
        <button 
          onClick={() => {
            console.log('[sidebar-session-list.tsx] Default Session clicked. Switching thread to: "default-legal-session"');
            setThreadId("default-legal-session");
          }}
          className={`w-full text-left p-2.5 rounded-lg flex items-center space-x-2 transition-colors ${
            threadId === "default-legal-session" 
              ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/60 text-emerald-950 dark:text-white" 
              : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="truncate">Default legal session</span>
        </button>
      </div>
    </ScrollArea>
  );
}
