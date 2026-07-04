import React from "react";
import { BookOpen, CheckCircle, Scale } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Citation } from "@/hooks/useLegalChat";

interface CitationSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCitation: Citation | null;
}

export function CitationSheet({
  isOpen,
  onOpenChange,
  selectedCitation,
}: CitationSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
        {/* Broad sidebar layout wrap with padding */}
        <div className="p-6 flex flex-col h-full space-y-6">
          <SheetHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800 p-0">
            <SheetTitle className="text-zinc-950 dark:text-white flex items-center space-x-2 text-lg">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              <span>Citation Inspector</span>
            </SheetTitle>
            <SheetDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
              Previewing source metadata from the indexed database.
            </SheetDescription>
          </SheetHeader>
          
          {selectedCitation ? (
            <div className="space-y-5 text-sm flex-1 overflow-y-auto pr-1">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wide text-zinc-400 block">Citation Identifier</span>
                <span className="font-mono text-zinc-950 dark:text-white text-base font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 inline-block mt-1">
                  {selectedCitation.node_id}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wide text-zinc-400 block">Section Title</span>
                <p className="text-zinc-800 dark:text-zinc-200 mt-1.5 font-semibold text-sm bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {selectedCitation.title || "Loading Title..."}
                </p>
              </div>

              {selectedCitation.page_range && selectedCitation.page_range.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wide text-zinc-400 block">PDF Page Range</span>
                  <span className="text-zinc-700 dark:text-zinc-300 mt-1 font-mono text-xs">
                    Pages {selectedCitation.page_range[0]} - {selectedCitation.page_range[1]}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-2">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  <p>This document is verified and served by the Vectorless-RAG hierarchical parser.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  <p>Statutory content corresponds to the updated Indian Criminal Code (Bharatiya Nyaya Sanhita triad, 2023).</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-zinc-500 text-sm flex-1 flex items-center justify-center">
              No citation loaded.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
