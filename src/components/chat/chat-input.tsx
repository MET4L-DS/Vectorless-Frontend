import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
      <motion.form 
        onSubmit={onSubmit} 
        animate={{
          scale: isFocused ? 1.005 : 1,
          boxShadow: isFocused ? "0 4px 20px -2px rgba(16, 185, 129, 0.08)" : "0 0px 0px 0px rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.2 }}
        className="max-w-3xl mx-auto flex items-center space-x-2 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:border-emerald-500/50 transition-colors"
      >
        <Input
          type="text"
          placeholder="Ask a legal scenario (e.g. rights of arrest, robbery penalty)..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isStreaming}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-900 dark:text-zinc-200 h-9"
        />
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            type="submit" 
            disabled={!inputVal.trim() || isStreaming}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg h-9 w-9 flex items-center justify-center cursor-pointer"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}

