import React from "react";
import { ChatMessage, Citation } from "@/hooks/useLegalChat";
import { ReasoningAccordion } from "./reasoning-accordion";
import { MessageContent } from "./message-content";
import { CitationFooter } from "./citation-footer";
import { motion, AnimatePresence } from "framer-motion";

interface MessageItemProps {
	msg: ChatMessage;
	isStreaming: boolean;
	isLastMessage: boolean;
	onCitationClick: (citation: Citation) => void;
}

export function MessageItem({
	msg,
	isStreaming,
	isLastMessage,
	onCitationClick,
}: MessageItemProps) {
	// Add debugging logs to track mounts and updates for reveal animations
	React.useEffect(() => {
		console.log(
			`[message-item.tsx] Mounted MessageItem (ID: ${msg.id}, Role: ${msg.role})`,
		);
		return () => {
			console.log(
				`[message-item.tsx] Unmounted MessageItem (ID: ${msg.id})`,
			);
		};
	}, [msg.id, msg.role]);

	React.useEffect(() => {
		console.log(
			`[message-item.tsx] ID: ${msg.id} state update | isStreaming: ${isStreaming} | isLastMessage: ${isLastMessage} | hasContent: ${!!msg.content} | contentLength: ${msg.content?.length || 0}`,
		);
	}, [msg.id, isStreaming, isLastMessage, msg.content]);

	return (
		<div
			className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
		>
			<motion.div
				layout="position"
				initial={
					msg.role === "assistant"
						? { opacity: 0, scale: 0.98, filter: "blur(6px)", y: 8 }
						: { opacity: 0, y: 6 }
				}
				animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
				transition={{
					duration: 0.45,
					ease: [0.16, 1, 0.3, 1], // premium custom easing
				}}
				className={`max-w-[85%] rounded-2xl px-8 py-6 border transition-all ${
					msg.role === "user"
						? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white rounded-br-none"
						: "w-full bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none"
				}`}
			>
				{/* Intermediate Reasoning Accordion (Only for Assistant) */}
				{msg.role === "assistant" &&
					msg.steps &&
					msg.steps.length > 0 && (
						<ReasoningAccordion
							steps={msg.steps}
							isStreaming={isStreaming}
							isLastMessage={isLastMessage}
						/>
					)}

				{/* AnimatePresence for transitions between skeleton and real text content */}
				<AnimatePresence mode="wait">
					{msg.role === "assistant" && !msg.content && isStreaming ? (
						<motion.div
							key="skeleton"
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, filter: "blur(4px)", y: -4 }}
							transition={{ duration: 0.25 }}
							className="space-y-2.5 mt-2 mb-4"
						>
							<div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full animate-pulse"></div>
							<div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-11/12 animate-pulse"></div>
							<div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-4/5 animate-pulse"></div>
							<div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full animate-pulse"></div>
							<div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4 animate-pulse"></div>
						</motion.div>
					) : (
						<motion.div
							key="content"
							initial={
								msg.role === "assistant"
									? { opacity: 0 }
									: { opacity: 0 }
							}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3, ease: "easeOut" }}
							onAnimationStart={() => {
								console.log(
									`[message-item.tsx] Reveal animation started for ID: ${msg.role === "assistant" ? msg.id : "user-msg"}`,
								);
							}}
							onAnimationComplete={() => {
								console.log(
									`[message-item.tsx] Reveal animation completed for ID: ${msg.role === "assistant" ? msg.id : "user-msg"}`,
								);
							}}
						>
							{msg.role === "user" ? (
								<p className="text-sm leading-relaxed">{msg.content}</p>
							) : (
								<MessageContent
									msg={msg}
									isStreaming={isStreaming && isLastMessage}
									onCitationClick={onCitationClick}
								/>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Citations Footer list */}
				{msg.role === "assistant" &&
					msg.citations &&
					msg.citations.length > 0 && (
						<CitationFooter
							citations={msg.citations}
							onCitationClick={onCitationClick}
						/>
					)}
			</motion.div>
		</div>
	);
}
