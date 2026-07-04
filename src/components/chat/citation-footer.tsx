import React from "react";
import { FileText } from "lucide-react";
import { Citation } from "@/hooks/useLegalChat";

interface CitationFooterProps {
  citations: Citation[];
  onCitationClick: (citation: Citation) => void;
}

export function CitationFooter({
  citations,
  onCitationClick,
}: CitationFooterProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-850 flex flex-wrap gap-2">
      {citations.map((cit, idx) => (
        <div
          key={idx}
          onClick={() => {
            console.log(`[citation-footer.tsx] Footer citation tag clicked. Rendering sheet for:`, cit);
            onCitationClick(cit);
          }}
          className="flex items-center font-sans space-x-1 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 hover:border-emerald-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-emerald-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer"
        >
          <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
          <span>{cit.node_id}</span>
        </div>
      ))}
    </div>
  );
}
