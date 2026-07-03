"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLegalChat, Citation } from "@/hooks/useLegalChat";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { Brain } from "lucide-react";

// Extracted modular components
import { AuthScreen } from "@/components/chat/auth-screen";
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

	// Auth state
	const { data: session, isPending } = authClient.useSession();
	const [authEmail, setAuthEmail] = useState("");
	const [authPassword, setAuthPassword] = useState("");
	const [authName, setAuthName] = useState("");
	const [isRegistering, setIsRegistering] = useState(false);
	const [authError, setAuthError] = useState("");

	// Citation details sheet state
	const [selectedCitation, setSelectedCitation] = useState<Citation | null>(
		null,
	);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Load history on mount or thread change
	useEffect(() => {
		console.log(
			`[page.tsx] fetchHistory effect triggered. Current threadId: "${threadId}"`,
		);
		fetchHistory();
	}, [threadId, fetchHistory]);

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
				const response = await authClient.signUp.email({
					email: authEmail,
					password: authPassword,
					name: authName,
				});
				console.log(
					"[page.tsx] Auth signUp.email succeeded.",
					response,
				);
			} else {
				const response = await authClient.signIn.email({
					email: authEmail,
					password: authPassword,
				});
				console.log(
					"[page.tsx] Auth signIn.email succeeded.",
					response,
				);
			}
		} catch (err: any) {
			console.error("[page.tsx] Auth operation failed:", err);
			setAuthError(err.message || "Authentication failed.");
		}
	};

	const handleSignOut = async () => {
		console.log(
			"[page.tsx] handleSignOut triggered. Requesting session logout...",
		);
		try {
			await authClient.signOut();
			console.log("[page.tsx] Auth signOut succeeded.");
		} catch (err) {
			console.error("[page.tsx] Auth signOut failed:", err);
		}
	};

	const handleCitationClick = (citation: Citation) => {
		console.log(
			"[page.tsx] Citation clicked. Selecting citation & opening sheet:",
			citation,
		);
		setSelectedCitation(citation);
		setIsSheetOpen(true);
	};

	// Auth Screen
	if (!isPending && !session) {
		return (
			<AuthScreen
				authEmail={authEmail}
				setAuthEmail={setAuthEmail}
				authPassword={authPassword}
				setAuthPassword={setAuthPassword}
				authName={authName}
				setAuthName={setAuthName}
				isRegistering={isRegistering}
				setIsRegistering={setIsRegistering}
				authError={authError}
				onSubmit={handleAuthSubmit}
			/>
		);
	}

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
							<div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-850 text-emerald-600 dark:text-emerald-500">
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

			{/* Tailwind v4 Safelisting for markdown classes */}
			<ProseSafelist />
		</div>
	);
}
