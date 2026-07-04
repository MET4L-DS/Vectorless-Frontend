import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Scale } from "lucide-react";
import { ChatMessage, Citation } from "@/hooks/useLegalChat";

interface MessageContentProps {
	msg: ChatMessage;
	onCitationClick: (citation: Citation) => void;
}

export function MessageContent({ msg, onCitationClick }: MessageContentProps) {
	const text = msg.content;
	if (!text) return null;

	// Convert [Source: BNS_S309, BNS_S310] to multiple markdown links using custom scheme #citation-
	const preprocessCitations = (content: string) => {
		return content.replace(
			/\[Source:\s*([^\]]+)\]/g,
			(match, idsString) => {
				const ids = idsString
					.split(",")
					.map((id: string) => id.trim())
					.filter((id: string) => id);
				return ids
					.map((id: string) => `[${id}](#citation-${id})`)
					.join(" ");
			},
		);
	};

	const preprocessedText = preprocessCitations(text);

	const components = {
		a: ({ href, children }: any) => {
			if (href && href.startsWith("#citation-")) {
				const citationId = href.replace("#citation-", "");
				const matchedCitation = (msg.citations || []).find(
					(c) => c.node_id === citationId,
				);

				return (
					<button
						onClick={() => {
							console.log(
								`[message-content.tsx] Rendering citation sheet for inline link: "${citationId}"`,
							);
							if (matchedCitation) {
								console.log(
									`[message-content.tsx] Matching citation metadata loaded:`,
									matchedCitation,
								);
								onCitationClick(matchedCitation);
							} else {
								console.warn(
									`[message-content.tsx] No matching citation metadata found for ID: "${citationId}". Reverting to placeholder.`,
								);
								onCitationClick({
									node_id: citationId,
									title: `${citationId.replace("_", " ")}`,
									page_range: [],
								});
							}
						}}
						className="inline-flex items-center font-sans mx-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 transition-colors cursor-pointer"
					>
						<BookOpen className="w-3 h-3 mr-0.5" />
						{children}
					</button>
				);
			}
			return (
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="text-emerald-600 dark:text-emerald-400 hover:underline"
				>
					{children}
				</a>
			);
		},
	};

	return (
		<div className="prose font-serif prose-emerald dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-200 text-sm leading-relaxed">
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
							<li
								key={idx}
								className="text-zinc-700 dark:text-zinc-300"
							>
								<ReactMarkdown
									components={components}
									remarkPlugins={[remarkGfm]}
								>
									{preprocessCitations(provision)}
								</ReactMarkdown>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
