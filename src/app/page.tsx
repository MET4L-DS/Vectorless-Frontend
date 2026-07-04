"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLegalChat, Citation } from "@/hooks/useLegalChat";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "next-themes";
import { Brain } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Extracted modular components
import { Sidebar } from "@/components/chat/sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageItem } from "@/components/chat/message-item";
import { ChatInput } from "@/components/chat/chat-input";
import { CitationSheet } from "@/components/chat/citation-sheet";
import { ProseSafelist } from "@/components/chat/prose-safelist";

export default function Home() {
	const [threadId, setThreadId] = useState<string>("default-legal-session");
	const {
		messages,
		sendMessage,
		isStreaming,
		fetchHistory,
		clearHistory,
		clearHistoryLocal,
	} = useLegalChat(threadId);
	const [inputVal, setInputVal] = useState("");

	// Theme state
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Supabase client instance
	const supabase = createClient();

	// Auth state
	const [session, setSession] = useState<any>(null);
	const [isPending, setIsPending] = useState(true);
	const [authEmail, setAuthEmail] = useState("");
	const [authPassword, setAuthPassword] = useState("");
	const [authName, setAuthName] = useState("");
	const [isRegistering, setIsRegistering] = useState(false);
	const [authError, setAuthError] = useState("");
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	// Citation details sheet state
	const [selectedCitation, setSelectedCitation] = useState<Citation | null>(
		null,
	);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Sync Supabase session & handle guest anonymous login on load
	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
			setSession(currentSession);
			setIsPending(false);
			
			// If no session exists, log in anonymously as a guest
			if (!currentSession) {
				console.log("[page.tsx] No active session found. Signing in anonymously...");
				supabase.auth.signInAnonymously().then(({ data, error }) => {
					if (error) console.error("[page.tsx] Anonymous sign in failed:", error);
				});
			}
		});

		// Listen to auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
			console.log(`[page.tsx] Auth state change event: ${event}`, currentSession);
			setSession(currentSession);
			setIsPending(false);
			
			// Auto anonymous sign-in if they sign out
			if (event === 'SIGNED_OUT' || !currentSession) {
				supabase.auth.signInAnonymously();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	// Load history on mount or thread change
	useEffect(() => {
		if (isPending || !session) {
			console.log(`[page.tsx] fetchHistory skipped: session is still loading or null.`);
			return;
		}
		console.log(
			`[page.tsx] fetchHistory effect triggered. Current threadId: "${threadId}"`,
		);
		fetchHistory();
	}, [threadId, fetchHistory, isPending, session]);

	// Set mounted state to prevent hydration errors for theme
	useEffect(() => {
		console.log(
			`[page.tsx] Mount effect triggered. React rendering successfully on client.`,
		);
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
		console.log(
			`[page.tsx] handleSend triggered. Input value: "${inputVal}"`,
		);
		if (!inputVal.trim() || isStreaming) {
			console.warn(
				"[page.tsx] handleSend execution blocked. Empty input or active stream in progress.",
			);
			return;
		}
		sendMessage(inputVal);
		setInputVal("");
	};

	const handleClear = () => {
		console.log(
			`[page.tsx] handleClear triggered. Dispatching clearHistory API request for threadId: "${threadId}"`,
		);
		clearHistory();
	};

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setAuthError("");
		console.log(
			`[page.tsx] handleAuthSubmit triggered. Action: ${isRegistering ? "SignUp" : "SignIn"}, Email: "${authEmail}"`,
		);
		try {
			if (isRegistering) {
				// Upgrade the guest anonymous account to permanent
				const { data, error } = await supabase.auth.updateUser({
					email: authEmail,
					password: authPassword,
					data: { name: authName }
				});
				if (error) throw error;
				console.log("[page.tsx] Supabase anonymous upgrade succeeded:", data);
				setIsAuthModalOpen(false);
			} else {
				// Standard user login
				const { data, error } = await supabase.auth.signInWithPassword({
					email: authEmail,
					password: authPassword,
				});
				if (error) throw error;
				console.log("[page.tsx] Supabase signInWithPassword succeeded:", data);
				setIsAuthModalOpen(false);
			}
		} catch (err: any) {
			console.error("[page.tsx] Auth operation failed:", err);
			setAuthError(err.message || "Authentication failed.");
		}
	};

	const handleGoogleSignIn = async () => {
		setAuthError("");
		console.log("[page.tsx] handleGoogleSignIn initiated.");
		try {
			const isAnonymous = session?.user?.is_anonymous || false;
			const redirectTo = `${window.location.origin}/auth/callback`;

			if (isAnonymous) {
				console.log("[page.tsx] Upgrading anonymous session with Google OAuth...");
				const { error } = await supabase.auth.linkIdentity({
					provider: "google",
					options: { redirectTo }
				});
				if (error) throw error;
			} else {
				console.log("[page.tsx] Starting normal Google OAuth flow...");
				const { error } = await supabase.auth.signInWithOAuth({
					provider: "google",
					options: { redirectTo }
				});
				if (error) throw error;
			}
		} catch (err: any) {
			console.error("[page.tsx] Google OAuth failed:", err);
			setAuthError(err.message || "Google authentication failed.");
		}
	};

	const handleSignOut = async () => {
		console.log(
			"[page.tsx] handleSignOut triggered. Requesting session logout...",
		);
		try {
			await supabase.auth.signOut();
			console.log("[page.tsx] Auth signOut succeeded.");
		} catch (err) {
			console.error("[page.tsx] Auth signOut failed:", err);
		}
	};

	const handleCitationClick = React.useCallback((citation: Citation) => {
		console.log(
			"[page.tsx] Citation clicked. Selecting citation & opening sheet:",
			citation,
		);
		setSelectedCitation(citation);
		setIsSheetOpen(true);
	}, []);

	return (
		<div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 overflow-hidden font-sans">
			{/* Sidebar Panel */}
			<Sidebar
				threadId={threadId}
				setThreadId={setThreadId}
				onNewSession={() => {
					const newId = `session-${Date.now()}`;
					console.log(`[page.tsx] New Session created: "${newId}"`);
					setThreadId(newId);
					clearHistoryLocal();
				}}
				session={session}
				onSignOut={handleSignOut}
				onSignInClick={() => setIsAuthModalOpen(true)}
			/>

			{/* Main Chat Panel */}
			<main className="flex-1 flex flex-col justify-between bg-white dark:bg-zinc-950">
				{/* Chat Header */}
				<ChatHeader
					threadId={threadId}
					theme={theme}
					setTheme={setTheme}
					mounted={mounted}
					onClearChat={handleClear}
				/>

				{/* Scrollable Message List */}
				<div className="flex-1 overflow-y-auto p-4 space-y-6">
					{messages.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
							<div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-500">
								<Brain className="w-10 h-10" />
							</div>
							<h2 className="text-xl font-bold text-zinc-900 dark:text-white">
								Ask an Indian Criminal Law Query
							</h2>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								Enter your query scenario. The autonomous ReAct
								agent will search the statutes (BNS, BNSS, BSA)
								and police SOP guidelines to resolve your query
								with exact citations.
							</p>
						</div>
					) : (
						<div className="space-y-6 max-w-4xl mx-auto">
							{messages.map((msg, index) => (
								<MessageItem
									key={msg.id}
									msg={msg}
									isStreaming={isStreaming}
									isLastMessage={
										index === messages.length - 1
									}
									onCitationClick={handleCitationClick}
								/>
							))}
							<div ref={scrollContainerRef} />
						</div>
					)}
				</div>

				{/* TextInput Box */}
				<ChatInput
					inputVal={inputVal}
					setInputVal={setInputVal}
					isStreaming={isStreaming}
					onSubmit={handleSend}
				/>
			</main>

			{/* Citation Preview Sheet (Sidebar Drawer) */}
			<CitationSheet
				isOpen={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				selectedCitation={selectedCitation}
			/>

			{/* Auth Modal Overlay */}
			<AnimatePresence>
				{isAuthModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						{/* Backdrop */}
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsAuthModalOpen(false)}
							className="absolute inset-0 bg-black/60 backdrop-blur-xs"
						/>
						{/* Modal Card */}
						<motion.div 
							initial={{ opacity: 0, scale: 0.95, y: 15 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 15 }}
							transition={{ type: "spring", duration: 0.4 }}
							className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden z-10"
						>
							{/* Shimmer emerald accent line */}
							<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
							
							<div className="space-y-4">
								<div className="text-center space-y-1">
									<h3 className="text-xl font-bold text-zinc-900 dark:text-white">
										{isRegistering ? "Save Your History" : "Welcome Back"}
									</h3>
									<p className="text-xs text-zinc-500 dark:text-zinc-400">
										{isRegistering 
											? "Link your guest session to an email to permanently save your chat history and unlock features." 
											: "Sign in to access your saved chat sessions."
										}
									</p>
								</div>

								<form onSubmit={handleAuthSubmit} className="space-y-3.5">
									{isRegistering && (
										<div className="space-y-1">
											<label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
											<input 
												type="text" 
												value={authName}
												onChange={(e) => setAuthName(e.target.value)}
												placeholder="John Doe"
												className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
												required
											/>
										</div>
									)}
									
									<div className="space-y-1">
										<label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
										<input 
											type="email" 
											value={authEmail}
											onChange={(e) => setAuthEmail(e.target.value)}
											placeholder="john@example.com"
											className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
											required
										/>
									</div>

									<div className="space-y-1">
										<label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
										<input 
											type="password" 
											value={authPassword}
											onChange={(e) => setAuthPassword(e.target.value)}
											placeholder="••••••••"
											className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
											required
										/>
									</div>

									{authError && (
										<p className="text-xs text-red-600 dark:text-red-400 text-center font-medium bg-red-50 dark:bg-red-950/20 py-1.5 rounded-md border border-red-200/50 dark:border-red-950/30">
											{authError}
										</p>
									)}

									<button 
										type="submit"
										className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm rounded-lg shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
									>
										{isRegistering ? "Create Account & Upgrade" : "Sign In"}
									</button>
								</form>

								<div className="relative flex py-1 items-center">
									<div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
									<span className="flex-shrink mx-4 text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">or</span>
									<div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
								</div>

								<button 
									type="button"
									onClick={handleGoogleSignIn}
									className="w-full flex items-center justify-center gap-2.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs transition duration-200 cursor-pointer"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24">
										<path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.187 4.114-3.488 0-6.315-2.827-6.315-6.315s2.827-6.315 6.315-6.315c1.666 0 3.125.651 4.223 1.704l3.14-3.14C19.14 2.235 15.82 1 12 1 5.925 1 12 5.925 1 12s4.925 11 11 11c5.96 0 10.64-4.22 10.64-10.64 0-.61-.053-1.22-.16-1.815l-10.24.085z"/>
									</svg>
									<span>{isRegistering ? "Register with Google" : "Continue with Google"}</span>
								</button>

								<div className="text-center">
									<button 
										onClick={() => {
											setIsRegistering(!isRegistering);
											setAuthError("");
										}}
										className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 font-medium hover:underline cursor-pointer"
									>
										{isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up & Save History"}
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Tailwind v4 Safelisting for markdown classes */}
			<ProseSafelist />
		</div>
	);
}
