"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLegalChat, Citation } from "@/hooks/useLegalChat";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "next-themes";
import { Scale, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Extracted modular components
import { Sidebar } from "@/components/chat/sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageItem } from "@/components/chat/message-item";
import { ChatInput } from "@/components/chat/chat-input";
import { CitationSheet } from "@/components/chat/citation-sheet";
import { UserSettingsModal } from "@/components/chat/user-settings-modal";
import { ProseSafelist } from "@/components/chat/prose-safelist";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function Home() {
	const [threadId, setThreadId] = useState<string>("");
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [sessionsList, setSessionsList] = useState<
		{ id: string; title?: string }[]
	>([]);
	const {
		messages,
		sendMessage,
		isStreaming,
		isFetchingHistory,
		fetchHistory,
		clearHistory,
		clearHistoryLocal,
	} = useLegalChat(threadId, {
		onTitleGenerated: (title) => {
			console.log(`[page.tsx] Dynamic title generated: "${title}"`);
			setSessionsList((prev) =>
				prev.map((s) => (s.id === threadId ? { ...s, title } : s)),
			);
		},
	});
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
	const [showAuthPassword, setShowAuthPassword] = useState(false);

	// Citation details sheet state
	const [selectedCitation, setSelectedCitation] = useState<Citation | null>(
		null,
	);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Sync Supabase session & handle guest anonymous login on load
	useEffect(() => {
		// Restore threadId from local storage
		let savedThread = localStorage.getItem("activeThreadId");
		if (!savedThread) {
			savedThread = `session-${Date.now()}`;
			localStorage.setItem("activeThreadId", savedThread);
		}
		setThreadId(savedThread);

		// Listen to auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, currentSession) => {
			console.log(
				`[page.tsx] Auth state change event: ${event}`,
				{
					userId: currentSession?.user?.id,
					email: currentSession?.user?.email,
					isAnonymous: currentSession?.user?.is_anonymous,
					role: currentSession?.user?.role,
					accessToken: currentSession?.access_token ? `${currentSession.access_token.substring(0, 20)}...` : null,
					expiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toLocaleString() : null
				}
			);
			setSession(currentSession);
			setIsPending(false);

			// Auto anonymous sign-in if they sign out or if initial session is null
			if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !currentSession)) {
				console.log(
					"[page.tsx] No active session found. Signing in anonymously...",
				);
				supabase.auth.signInAnonymously().then(({ data, error }) => {
					if (error) {
						console.error("[page.tsx] Anonymous sign in failed:", error);
					} else {
						console.log("[page.tsx] Anonymous sign in completed successfully:", data.session?.user?.id);
					}
				}).catch((error) => {
					console.error("[page.tsx] Anonymous sign in encountered unexpected error:", error);
				});
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	// Fetch sessions list once auth is ready
	useEffect(() => {
		if (isPending || !session) return;

		const API_BASE =
			process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
		const fetchSessions = async () => {
			try {
				const {
					data: { session: currentSession },
				} = await supabase.auth.getSession();
				const token = currentSession?.access_token;
				const res = await fetch(`${API_BASE}/api/chats/sessions`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				if (res.ok) {
					const data = await res.json();
					if (data.sessions && data.sessions.length > 0) {
						const fetched = data.sessions;
						let savedThread =
							localStorage.getItem("activeThreadId") || threadId;
						if (savedThread) {
							if (
								!fetched.some((s: any) => s.id === savedThread)
							) {
								fetched.unshift({
									id: savedThread,
									title: "New Legal Chat",
								});
							}
							setSessionsList(fetched);
							setThreadId(savedThread);
						} else {
							setSessionsList(fetched);
							setThreadId(fetched[0].id);
							localStorage.setItem(
								"activeThreadId",
								fetched[0].id,
							);
						}
					} else {
						let savedThread =
							localStorage.getItem("activeThreadId") || threadId;
						if (!savedThread) {
							savedThread = `session-${Date.now()}`;
							localStorage.setItem("activeThreadId", savedThread);
						}
						setSessionsList([
							{ id: savedThread, title: "New Legal Chat" },
						]);
						setThreadId(savedThread);
					}
				} else {
					console.error(`[page.tsx] Failed to fetch sessions list. Status: ${res.status}`);
				}
			} catch (e) {
				console.error("[page.tsx] Error fetching sessions list:", e);
			}
		};
		fetchSessions();
	}, [session, isPending, supabase.auth]);

	// Load history on mount or thread change
	useEffect(() => {
		if (isPending || !session) {
			console.log(
				`[page.tsx] fetchHistory skipped: session is still loading or null.`,
			);
			return;
		}
		console.log(
			`[page.tsx] fetchHistory effect triggered. Current threadId: "${threadId}"`,
		);
		localStorage.setItem("activeThreadId", threadId);

		// If threadId is a locally generated timestamp string that was created within the last 3000ms,
		// skip fetchHistory since it's a fresh session and has no backend history yet.
		// This prevents showing the skeleton loading screen on new session creation.
		const match = threadId.match(/^session-(\d+)$/);
		if (match) {
			const timestamp = parseInt(match[1], 10);
			if (Date.now() - timestamp < 3000) {
				console.log(
					`[page.tsx] Skipping fetchHistory for just-created session: "${threadId}"`
				);
				return;
			}
		}

		fetchHistory();
	}, [threadId, fetchHistory, isPending, session?.user?.id]);

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

	const handleClear = async () => {
		console.log(
			`[page.tsx] handleClear triggered (acting as full delete) for threadId: "${threadId}"`,
		);
		try {
			await clearHistory();

			const updatedList = sessionsList.filter((s) => s.id !== threadId);
			if (updatedList.length > 0) {
				setSessionsList(updatedList);
				const nextActive = updatedList[0].id;
				setThreadId(nextActive);
				localStorage.setItem("activeThreadId", nextActive);
			} else {
				const freshId = `session-${Date.now()}`;
				setSessionsList([{ id: freshId, title: "New Legal Chat" }]);
				setThreadId(freshId);
				localStorage.setItem("activeThreadId", freshId);
			}
			clearHistoryLocal();
		} catch (err) {
			console.error("[page.tsx] Failed to delete session:", err);
		}
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
				const { data, error } = await supabase.auth.updateUser(
					{
						email: authEmail,
						password: authPassword,
						data: { name: authName },
					},
					{
						emailRedirectTo: `${window.location.origin}/auth/callback`,
					}
				);
				if (error) throw error;
				console.log(
					"[page.tsx] Supabase anonymous upgrade succeeded:",
					data,
				);
				setIsAuthModalOpen(false);
			} else {
				// Standard user login
				const { data, error } = await supabase.auth.signInWithPassword({
					email: authEmail,
					password: authPassword,
				});
				if (error) throw error;
				console.log(
					"[page.tsx] Supabase signInWithPassword succeeded:",
					data,
				);
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

			if (isAnonymous && isRegistering) {
				console.log(
					"[page.tsx] Upgrading anonymous session with Google OAuth...",
				);
				const { error } = await supabase.auth.linkIdentity({
					provider: "google",
					options: { redirectTo },
				});
				if (error) throw error;
			} else {
				console.log("[page.tsx] Starting normal Google OAuth flow...");
				const { error } = await supabase.auth.signInWithOAuth({
					provider: "google",
					options: { redirectTo },
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
		<div className="flex h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 overflow-hidden font-sans">
			{/* Sidebar Panel */}
			<Sidebar
				threadId={threadId}
				setThreadId={setThreadId}
				sessionsList={sessionsList}
				onNewSession={() => {
					// Guard against spamming empty new sessions in the list
					if (messages.length === 0 && !isFetchingHistory) {
						console.log(
							"[page.tsx] onNewSession ignored: current session is already empty."
						);
						return;
					}
					const newId = `session-${Date.now()}`;
					console.log(`[page.tsx] New Session created: "${newId}"`);
					localStorage.setItem("activeThreadId", newId);
					// Save the new session to the top of the list locally
					setSessionsList((prev) => [{ id: newId }, ...prev]);
					setThreadId(newId);
					clearHistoryLocal();
				}}
				session={session}
				onSignOut={handleSignOut}
				onSignInClick={() => setIsAuthModalOpen(true)}
				onSettingsClick={() => setIsSettingsOpen(true)}
				className="hidden md:flex"
			/>

			{/* Mobile Sidebar Sheet Drawer */}
			<Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
				<SheetContent side="left" showCloseButton={false} className="p-0 w-64 border-none">
					<Sidebar
						threadId={threadId}
						setThreadId={(id) => {
							setThreadId(id);
							setIsMobileSidebarOpen(false);
						}}
						sessionsList={sessionsList}
						onNewSession={() => {
							if (messages.length === 0 && !isFetchingHistory) {
								return;
							}
							const newId = `session-${Date.now()}`;
							localStorage.setItem("activeThreadId", newId);
							setSessionsList((prev) => [{ id: newId }, ...prev]);
							setThreadId(newId);
							clearHistoryLocal();
							setIsMobileSidebarOpen(false);
						}}
						session={session}
						onSignOut={() => {
							handleSignOut();
							setIsMobileSidebarOpen(false);
						}}
						onSignInClick={() => {
							setIsAuthModalOpen(true);
							setIsMobileSidebarOpen(false);
						}}
						onSettingsClick={() => {
							setIsSettingsOpen(true);
							setIsMobileSidebarOpen(false);
						}}
						className="flex h-full w-full border-r-0"
					/>
				</SheetContent>
			</Sheet>

			{/* Main Chat Panel */}
			<main className="flex-1 flex flex-col justify-between bg-white dark:bg-zinc-950">
				{/* Chat Header */}
				<ChatHeader
					threadId={threadId}
					title={sessionsList.find((s) => s.id === threadId)?.title}
					theme={theme}
					setTheme={setTheme}
					mounted={mounted}
					onClearChat={handleClear}
					onMenuClick={() => setIsMobileSidebarOpen(true)}
				/>

				{/* Scrollable Message List */}
				<div className="flex-1 overflow-y-auto p-4 space-y-6">
					{isFetchingHistory ? (
						<div className="max-w-3xl mx-auto space-y-6 mt-4">
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.3 }}
								className="space-y-6"
							>
								{/* User query skeleton */}
								<div className="flex justify-end">
									<div className="w-1/3 h-14 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-2xl rounded-br-none animate-pulse"></div>
								</div>
								{/* Assistant response skeleton */}
								<div className="flex flex-col space-y-3 py-4 w-full">
									<div className="w-full h-3.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md animate-pulse"></div>
									<div className="w-11/12 h-3.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md animate-pulse"></div>
									<div className="w-4/5 h-3.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md animate-pulse"></div>
									<div className="w-full h-3.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md animate-pulse"></div>
									<div className="w-3/4 h-3.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md animate-pulse"></div>
								</div>
								{/* User query skeleton 2 */}
								<div className="flex justify-end">
									<div className="w-1/2 h-16 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-2xl rounded-br-none animate-pulse"></div>
								</div>
							</motion.div>
						</div>
					) : messages.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, ease: "easeOut" }}
							className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto py-10"
						>
							<div className="space-y-4 flex flex-col items-center">
								<motion.div
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{
										delay: 0.2,
										duration: 0.5,
										type: "spring",
										bounce: 0.5,
									}}
									className="p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-500 shadow-sm"
								>
									<Scale className="w-12 h-12" />
								</motion.div>
								<motion.h2
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3, duration: 0.4 }}
									className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight"
								>
									Ask an Indian Criminal Law Query
								</motion.h2>
								<motion.p
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4, duration: 0.4 }}
									className="text-base text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed"
								>
									Enter your query scenario. The autonomous
									Legal-Assist Agent will search the new
									statutes (BNS, BNSS, BSA) and police SOP
									guidelines to resolve your query with exact
									citations.
								</motion.p>
							</div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.6, duration: 0.5 }}
								className="w-full pt-6"
							>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
									{[
										"What is the punishment for robbery under BNS?",
										"When can police arrest without a warrant?",
										"What are the rights of an arrested person?",
										"Explain the right to private defence of property.",
									].map((suggestion) => (
										<button
											key={suggestion}
											onClick={() => {
												setInputVal(suggestion);
												setTimeout(() => {
													sendMessage(suggestion);
													setInputVal("");
												}, 50);
											}}
											className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left text-sm text-zinc-700 dark:text-zinc-300 transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm flex items-center group"
										>
											<span className="flex-1">
												{suggestion}
											</span>
											<span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
												→
											</span>
										</button>
									))}
								</div>
							</motion.div>
						</motion.div>
					) : (
						<div className="space-y-6 max-w-3xl mx-auto">
							{messages.map((msg, index) => (
								<MessageItem
									key={msg.id}
									msg={msg}
									isStreaming={isStreaming}
									isLastMessage={
										index === messages.length - 1
									}
									onCitationClick={handleCitationClick}
									onFollowUpClick={sendMessage}
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
										{isRegistering
											? "Save Your History"
											: "Welcome Back"}
									</h3>
									<p className="text-xs text-zinc-500 dark:text-zinc-400">
										{isRegistering
											? "Link your guest session to an email to permanently save your chat history and unlock features."
											: "Sign in to access your saved chat sessions."}
									</p>
								</div>

								<form
									onSubmit={handleAuthSubmit}
									className="space-y-3.5"
								>
									{isRegistering && (
										<div className="space-y-1">
											<label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
												Full Name
											</label>
											<input
												type="text"
												value={authName}
												onChange={(e) =>
													setAuthName(e.target.value)
												}
												placeholder="John Doe"
												className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
												required
											/>
										</div>
									)}

									<div className="space-y-1">
										<label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
											Email Address
										</label>
										<input
											type="email"
											value={authEmail}
											onChange={(e) =>
												setAuthEmail(e.target.value)
											}
											placeholder="john@example.com"
											className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
											required
										/>
									</div>

									<div className="space-y-1">
										<label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
											Password
										</label>
										<div className="relative">
											<input
												type={showAuthPassword ? "text" : "password"}
												value={authPassword}
												onChange={(e) =>
													setAuthPassword(e.target.value)
												}
												placeholder="••••••••"
												className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors pr-10"
												required
											/>
											<button
												type="button"
												onClick={() => setShowAuthPassword(!showAuthPassword)}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
											>
												{showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
											</button>
										</div>
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
										{isRegistering
											? "Create Account & Upgrade"
											: "Sign In"}
									</button>
								</form>

								<div className="relative flex py-1 items-center">
									<div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
									<span className="flex-shrink mx-4 text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
										or
									</span>
									<div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
								</div>

								<button
									type="button"
									onClick={handleGoogleSignIn}
									className="w-full flex items-center justify-center gap-2.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs transition duration-200 cursor-pointer"
								>
									<svg
										className="w-4 h-4"
										viewBox="0 0 24 24"
									>
										<path
											fill="#EA4335"
											d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.187 4.114-3.488 0-6.315-2.827-6.315-6.315s2.827-6.315 6.315-6.315c1.666 0 3.125.651 4.223 1.704l3.14-3.14C19.14 2.235 15.82 1 12 1 5.925 1 12 5.925 1 12s4.925 11 11 11c5.96 0 10.64-4.22 10.64-10.64 0-.61-.053-1.22-.16-1.815l-10.24.085z"
										/>
									</svg>
									<span>
										{isRegistering
											? "Register with Google"
											: "Continue with Google"}
									</span>
								</button>

								<div className="text-center">
									<button
										onClick={() => {
											setIsRegistering(!isRegistering);
											setAuthError("");
										}}
										className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 font-medium hover:underline cursor-pointer"
									>
										{isRegistering
											? "Already have an account? Sign In"
											: "Don't have an account? Sign Up & Save History"}
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			<UserSettingsModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				session={session}
				onSignOut={handleSignOut}
			/>

			{/* Tailwind v4 Safelisting for markdown classes */}
			<ProseSafelist />
		</div>
	);
}
