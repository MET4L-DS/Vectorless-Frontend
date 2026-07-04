import React from "react";
import { Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  inputVal: string;
  setInputVal: (val: string) => void;
  isStreaming: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({
  inputVal,
  setInputVal,
  isStreaming,
  onSubmit,
}: ChatInputProps) {
  return (
    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Ask a legal scenario (e.g. rights of arrest, robbery penalty)..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isStreaming}
          className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 text-zinc-900 dark:text-zinc-200"
        />
        <Button 
          type="submit" 
          disabled={!inputVal.trim() || isStreaming}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
