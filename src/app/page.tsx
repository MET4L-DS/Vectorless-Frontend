"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLegalChat, ChatMessage, Citation } from "@/hooks/useLegalChat";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, 
  Send, 
  Trash2, 
  Loader2, 
  Brain, 
  BookOpen, 
  CheckCircle,
  FileText,
  User,
  LogOut,
  Plus,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export default function Home() {
  const [threadId, setThreadId] = useState<string>("default-legal-session");
  const { messages, sendMessage, isStreaming, fetchHistory, clearHistory, clearHistoryLocal } = useLegalChat(threadId);
  const [inputVal, setInputVal] = useState("");
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Auth state
  const { data: session, isPending } = authClient.useSession();
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");

  // Citation details sheet state
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load history on mount or thread change
  useEffect(() => {
    fetchHistory();
  }, [threadId, fetchHistory]);

  // Set mounted state to prevent hydration errors for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isStreaming) return;
    sendMessage(inputVal);
    setInputVal("");
  };

  const handleClear = () => {
    clearHistory();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isRegistering) {
        await authClient.signUp.email({
          email: authEmail,
          password: authPassword,
          name: authName,
        });
      } else {
        await authClient.signIn.email({
          email: authEmail,
          password: authPassword,
        });
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const getReasoningLabel = (msg: ChatMessage) => {
    if (!msg.steps || msg.steps.length === 0) {
      return "Agent Reasoning Process";
    }
    const lastStep = msg.steps[msg.steps.length - 1];
    const isActive = isStreaming && messages[messages.length - 1]?.id === msg.id;
    
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
    
    return `Agent Reasoning Process (${msg.steps.length} updates)`;
  };

  // Helper to render inline clickable citations without causing paragraph wraps
  const renderMessageContent = (msg: ChatMessage) => {
    const text = msg.content;
    if (!text) return null;

    // Convert [Source: BNS_S309] to markdown links using custom scheme citation://
    const preprocessedText = text.replace(/\[Source:\s*([A-Za-z0-9_]+)\]/g, "[$1](citation://$1)");

    const components = {
      a: ({ href, children }: any) => {
        if (href && href.startsWith("citation://")) {
          const citationId = href.replace("citation://", "");
          const matchedCitation = (msg.citations || []).find(c => c.node_id === citationId);

          return (
            <button
              onClick={() => {
                if (matchedCitation) {
                  setSelectedCitation(matchedCitation);
                } else {
                  setSelectedCitation({
                    node_id: citationId,
                    title: `${citationId.replace("_", " ")}`,
                    page_range: []
                  });
                }
                setIsSheetOpen(true);
              }}
              className="inline-flex items-center mx-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              {children}
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            {children}
          </a>
        );
      }
    };

    return (
      <div className="prose prose-emerald dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed">
        <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
          {preprocessedText}
        </ReactMarkdown>
        {msg.key_provisions && msg.key_provisions.length > 0 && (
          <div className="mt-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg">
            <h4 className="text-emerald-800 dark:text-emerald-400 font-semibold mb-2 flex items-center">
              <Scale className="w-4 h-4 mr-2" />
              Key Provisions
            </h4>
            <ul className="space-y-1 mb-0">
              {msg.key_provisions.map((provision, idx) => (
                <li key={idx} className="text-zinc-700 dark:text-zinc-300">
                  <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                    {provision.replace(/\[Source:\s*([A-Za-z0-9_]+)\]/g, "[$1](citation://$1)")}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Auth Screen
  if (!isPending && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
        <Card className="w-full max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-emerald-600 dark:text-emerald-500">
                <Scale className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-950 dark:text-white">Vectorless-RAG Legal Hub</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Access the legal statutory & police SOP query resolver.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                    className="bg-zinc-50 dark:bg-zinc-850 border-zinc-250 dark:border-zinc-800 focus-visible:ring-emerald-500"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="bg-zinc-50 dark:bg-zinc-850 border-zinc-250 dark:border-zinc-800 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="bg-zinc-50 dark:bg-zinc-850 border-zinc-250 dark:border-zinc-800 focus-visible:ring-emerald-500"
                />
              </div>

              {authError && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 bg-red-100/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-2 rounded">{authError}</p>
              )}

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                {isRegistering ? "Register Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isRegistering ? "Already have an account? Sign In" : "Need an account? Register here"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 overflow-hidden font-sans">
      
      {/* Sidebar Panel */}
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
              onClick={() => {
                const newId = `session-${Date.now()}`;
                setThreadId(newId);
                clearHistoryLocal();
              }}
              className="w-full bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex justify-start space-x-2 text-xs"
            >
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>New Session</span>
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1 text-xs mt-2">
              <button 
                onClick={() => setThreadId("default-legal-session")}
                className={`w-full text-left p-2.5 rounded-lg flex items-center space-x-2 transition-colors ${
                  threadId === "default-legal-session" 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/60 text-emerald-950 dark:text-white" 
                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">Default legal session</span>
              </button>
            </div>
          </ScrollArea>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40 text-xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="truncate max-w-[120px]">
              <p className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">{session?.user?.name || "Legal Assistant"}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Chat Panel */}
      <main className="flex-1 flex flex-col justify-between bg-white dark:bg-zinc-950">
        
        {/* Chat Header */}
        <header className="h-14 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-850 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
              Thread: <span className="text-zinc-950 dark:text-zinc-200 normal-case font-mono">{threadId}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Dynamic Light/Dark Mode Toggle with slide/rotate transitions */}
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 overflow-hidden relative"
                title="Toggle Theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ y: -15, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 15, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-500" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear Chat
            </Button>
          </div>
        </header>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-850 text-emerald-600 dark:text-emerald-500">
                <Brain className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ask an Indian Criminal Law Query</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Enter your query scenario. The autonomous ReAct agent will search the statutes (BNS, BNSS, BSA) and police SOP guidelines to resolve your query with exact citations.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 border transition-all ${
                    msg.role === "user"
                      ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white rounded-br-none"
                      : "w-full bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-bl-none"
                  }`}>
                    
                    {/* Intermediate Reasoning Accordion (Only for Assistant) */}
                    {msg.role === "assistant" && msg.steps && msg.steps.length > 0 && (
                      <div className="mb-4">
                        <Accordion className="w-full border-none">
                          <AccordionItem value="thinking" className="border-none">
                            <AccordionTrigger className="py-1 px-3 text-xs bg-zinc-100 hover:bg-zinc-200/50 dark:bg-zinc-900 dark:hover:bg-zinc-850 rounded-lg text-amber-700 dark:text-amber-500 font-semibold flex items-center hover:no-underline border border-zinc-250/65 dark:border-zinc-800/40">
                              <span className="flex items-center space-x-2 overflow-hidden w-full">
                                {/* Only animate-spin loader if the message is actively streaming and is the last assistant response */}
                                {isStreaming && messages[messages.length - 1]?.id === msg.id && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-amber-600 dark:text-amber-500 shrink-0" />
                                )}
                                <span className="inline-block relative h-4 w-full overflow-hidden">
                                  <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                      key={getReasoningLabel(msg)}
                                      initial={{ y: 8, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      exit={{ y: -8, opacity: 0 }}
                                      transition={{ duration: 0.15, ease: "easeInOut" }}
                                      className="absolute left-0 top-0 block truncate w-full text-[11px] md:text-xs"
                                    >
                                      {getReasoningLabel(msg)}
                                    </motion.span>
                                  </AnimatePresence>
                                </span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-lg space-y-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 overflow-x-auto max-h-56">
                              {/* Animate list item expansions for incoming thought process updates */}
                              <AnimatePresence initial={false}>
                                {msg.steps.map((step, idx) => (
                                  <motion.div
                                    key={idx}
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
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}

                    {/* Final Answer Text / Skeleton Loading */}
                    {msg.role === "assistant" && !msg.content && isStreaming && (
                      <div className="space-y-2.5 animate-pulse mt-2 mb-4">
                        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full"></div>
                        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-11/12"></div>
                        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-4/5"></div>
                        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full"></div>
                        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4"></div>
                      </div>
                    )}

                    {msg.role === "user" ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      renderMessageContent(msg)
                    )}

                    {/* Citations Footer list */}
                    {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-850 flex flex-wrap gap-2">
                        {msg.citations.map((cit, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedCitation(cit);
                              setIsSheetOpen(true);
                            }}
                            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 hover:border-emerald-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-emerald-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-850 text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                            <span>{cit.node_id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={scrollContainerRef} />
            </div>
          )}
        </div>

        {/* TextInput Box */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center space-x-2">
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
      </main>

      {/* Citation Preview Sheet (Sidebar Drawer) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
          {/* Broad sidebar layout wrap with padding */}
          <div className="p-6 flex flex-col h-full space-y-6">
            <SheetHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-850 p-0">
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
                  <span className="font-mono text-zinc-950 dark:text-white text-base font-bold bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 inline-block mt-1">
                    {selectedCitation.node_id}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wide text-zinc-400 block">Section Title</span>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-1.5 font-semibold text-sm bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-850">
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

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-850 text-xs text-zinc-500 space-y-2">
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

    </div>
  );
}
