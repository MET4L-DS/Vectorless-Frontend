import React from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/hooks/useLegalChat";

interface ReasoningAccordionProps {
  steps: ChatMessage["steps"];
  isStreaming: boolean;
  isLastMessage: boolean;
}

export function ReasoningAccordion({
  steps,
  isStreaming,
  isLastMessage,
}: ReasoningAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = isStreaming && isLastMessage;

  // Auto-expand accordion when agent reasoning becomes active (streaming)
  React.useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  if (!steps || steps.length === 0) {
    return null;
  }

  const getReasoningLabel = () => {
    const lastStep = steps[steps.length - 1];
    
    if (isActive) {
      if (lastStep.type === "thought") {
        return "Agent Thought: Analyzing query & formulating plan...";
      }
      if (lastStep.type === "tool_call") {
        const toolMatch = lastStep.content.match(/Calling tool: ([A-Za-z0-9_]+)/);
        const toolName = toolMatch ? toolMatch[1] : "search tool";
        return `Agent Action: Querying ${toolName}...`;
      }
      if (lastStep.type === "observation") {
        return "Agent Observation: Processing retrieved context...";
      }
      if (lastStep.type === "error") {
        return "Agent Error: Execution encountered issues";
      }
    }
    
    return `Agent Reasoning Process (${steps.length} updates)`;
  };

  return (
    <motion.div 
      className="mb-4"
      initial={{ scale: 0.98, opacity: 0, y: 5 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="w-full">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-1.5 px-3 text-xs bg-zinc-100 hover:bg-zinc-200/50 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg text-emerald-700 dark:text-emerald-500 font-semibold flex items-center justify-between border border-zinc-200/65 dark:border-zinc-800/40 cursor-pointer select-none transition-colors"
        >
          <span className="flex items-center space-x-2 overflow-hidden w-full mr-2">
            {isActive && (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-emerald-600 dark:text-emerald-500 shrink-0" />
            )}
            <span className="inline-block relative h-4 w-full overflow-hidden text-left">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={getReasoningLabel()}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    backgroundPosition: isActive ? ["200% center", "-200% center"] : "0% center"
                  }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={
                    isActive 
                      ? { 
                          y: { duration: 0.15, ease: "easeInOut" },
                          opacity: { duration: 0.15, ease: "easeInOut" },
                          backgroundPosition: { repeat: Infinity, duration: 2.5, ease: "linear" }
                        }
                      : { duration: 0.15, ease: "easeInOut" }
                  }
                  className={`absolute left-0 top-0 block truncate w-full text-[11px] md:text-xs ${
                    isActive 
                      ? "bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-emerald-300 to-emerald-600 dark:from-emerald-400 dark:via-emerald-100 dark:to-emerald-400 bg-[length:200%_auto]" 
                      : "text-emerald-700 dark:text-emerald-500"
                  }`}
                >
                  {getReasoningLabel()}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="shrink-0 text-zinc-500 dark:text-zinc-400"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transition: {
                  height: { type: "spring", stiffness: 350, damping: 32 },
                  opacity: { duration: 0.2 }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  height: { duration: 0.22, ease: "easeInOut" },
                  opacity: { duration: 0.12 }
                }
              }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-lg space-y-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 overflow-y-auto max-h-56">
                <AnimatePresence initial={false}>
                  {steps.map((step, idx) => (
                    <motion.div
                      key={`${step.type}-${step.content.substring(0, 35)}-${idx}`}
                      initial={{ opacity: 0, height: 0, y: 5 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="border-b border-zinc-200/40 dark:border-zinc-900/50 pb-2 last:border-none last:pb-0 overflow-hidden"
                    >
                      {step.type === "thought" && (
                        <p className="text-zinc-600 dark:text-zinc-400">
                          <span className="text-amber-600 dark:text-amber-500 font-bold">[Thought]</span> {step.content}
                        </p>
                      )}
                      {step.type === "tool_call" && (
                        <p className="text-cyan-600 dark:text-cyan-400">
                          <span className="text-cyan-600 dark:text-cyan-500 font-bold">[Tool Call]</span> {step.content}
                        </p>
                      )}
                      {step.type === "observation" && (
                        <p className="text-emerald-600 dark:text-emerald-500">
                          <span className="text-emerald-600 dark:text-emerald-500 font-bold">[Observation]</span> {step.content}
                        </p>
                      )}
                      {step.type === "error" && (
                        <p className="text-red-500 dark:text-red-400">
                          <span className="text-red-600 dark:text-red-500 font-bold">[Error]</span> {step.content}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
