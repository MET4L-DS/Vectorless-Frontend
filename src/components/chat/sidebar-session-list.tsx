import React from "react";
import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  return (
    <ScrollArea className="flex-1 px-3">
      <div className="space-y-1 text-xs mt-2">
        {uniqueSessions.map((session) => (
          <button 
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
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate">
              {session.title || `Session ${session.id.slice(-4)}`}
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
