import React from "react";
import { User, Scale } from "lucide-react";
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
	onFollowUpClick?: (question: string) => void;
}

export function MessageItem({
	msg,
	isStreaming,
	isLastMessage,
	onCitationClick,
	onFollowUpClick,
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
			className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
				className={`transition-all ${
					msg.role === "user"
						? "max-w-[85%] rounded-2xl px-6 py-4 border bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white rounded-br-none"
						: "w-full py-4 text-zinc-800 dark:text-zinc-200"
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
								<p className="text-sm leading-relaxed">
									{msg.content}
								</p>
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

				{/* Action Items */}
				{msg.role === "assistant" &&
					msg.action_items &&
					msg.action_items.length > 0 &&
					!isStreaming && (
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.3 }}
							className="mt-4 p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-xs"
						>
							<div className="flex items-center space-x-2 font-semibold text-amber-800 dark:text-amber-400 mb-2">
								<span className="text-sm">📋</span>
								<span>Recommended Actions</span>
							</div>
							<ul className="space-y-1.5 list-disc list-inside text-zinc-700 dark:text-zinc-300">
								{msg.action_items.map((item, idx) => (
									<li key={idx}>{item}</li>
								))}
							</ul>
						</motion.div>
					)}

				{/* Suggested Follow-up Questions */}
				{msg.role === "assistant" &&
					msg.suggested_follow_up_questions &&
					msg.suggested_follow_up_questions.length > 0 &&
					!isStreaming && (
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.4 }}
							className="mt-4 space-y-2"
						>
							<p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
								Suggested Questions
							</p>
							<div className="flex flex-wrap gap-2">
								{msg.suggested_follow_up_questions.map(
									(q, idx) => (
										<button
											key={idx}
											onClick={() => onFollowUpClick?.(q)}
											className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-left text-xs font-medium rounded-xl text-emerald-700 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-800 transition-all shadow-xs"
										>
											{q}
										</button>
									),
								)}
							</div>
						</motion.div>
					)}

				{/* Citations Footer list */}
				{msg.role === "assistant" &&
					msg.citations &&
					msg.citations.length > 0 &&
					!isStreaming && (
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.6 }}
						>
							<CitationFooter
								citations={msg.citations}
								onCitationClick={onCitationClick}
							/>
						</motion.div>
					)}
			</motion.div>
		</div>
	);
}
