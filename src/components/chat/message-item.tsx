import React from "react";
import { ChatMessage, Citation } from "@/hooks/useLegalChat";
import { ReasoningAccordion } from "./reasoning-accordion";
import { MessageContent } from "./message-content";
import { CitationFooter } from "./citation-footer";

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
	return (
		<div
			className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
		>
			<div
				className={`max-w-[85%] rounded-2xl px-8 py-6 border transition-all ${
					msg.role === "user"
						? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white rounded-br-none"
						: "w-full bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-bl-none"
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
					<MessageContent
						msg={msg}
						onCitationClick={onCitationClick}
					/>
				)}

				{/* Citations Footer list */}
				{msg.role === "assistant" &&
					msg.citations &&
					msg.citations.length > 0 && (
						<CitationFooter
							citations={msg.citations}
							onCitationClick={onCitationClick}
						/>
					)}
			</div>
		</div>
	);
}
