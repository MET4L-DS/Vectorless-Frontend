import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Scale } from "lucide-react";
import { ChatMessage, Citation } from "@/hooks/useLegalChat";
import { GlowCursor } from "./glow-cursor";
import { motion } from "framer-motion";

interface MessageContentProps {
	msg: ChatMessage;
	isStreaming?: boolean;
	onCitationClick: (citation: Citation) => void;
}

// Helper to extract raw text content from a React element tree
const extractText = (children: any): string => {
	let text = "";
	React.Children.forEach(children, (child) => {
		if (typeof child === "string" || typeof child === "number") {
			text += child;
		} else if (
			React.isValidElement(child) &&
			child.props &&
			(child.props as any).children
		) {
			text += extractText((child.props as any).children);
		}
	});
	return text;
};

export function MessageContent({
	msg,
	isStreaming = false,
	onCitationClick,
}: MessageContentProps) {
	// A sub-component to track typing activity per block and animate an underline
	const StreamingBlock = React.useCallback(
		({ children, Component = "p", ...props }: any) => {
			const [isTyping, setIsTyping] = React.useState(true);

			// Extract the raw text from the children array.
			// This string will ONLY change if the actual text inside THIS specific block is currently being typed.
			const textContent = React.useMemo(() => extractText(children), [children]);

			React.useEffect(() => {
				setIsTyping(true);
				const t = setTimeout(() => setIsTyping(false), 800);
				return () => clearTimeout(t);
			}, [textContent]);

			return (
				<Component {...props}>
					<span
						className="transition-colors duration-1000 ease-out underline decoration-2 underline-offset-4"
						style={{
							textDecorationColor: isTyping
								? "rgba(16, 185, 129, 0.6)"
								: "transparent",
						}}
					>
						{children}
					</span>
				</Component>
			);
		},
		[],
	);

	const [displayedLength, setDisplayedLength] = React.useState(
		msg.isHistory ? msg.content?.length || 0 : 0,
	);

	React.useEffect(() => {
		if (!msg.content) return;

		if (isStreaming || displayedLength < msg.content.length) {
			const interval = setInterval(() => {
				setDisplayedLength((prev) => {
					const next = prev + 5; // smooth 500 chars/sec reveal speed
					if (next >= msg.content!.length) {
						clearInterval(interval);
						return msg.content!.length;
					}
					return next;
				});
			}, 10);
			return () => clearInterval(interval);
		} else {
			setDisplayedLength(msg.content.length);
		}
	}, [msg.content, isStreaming]);

	const isVisuallyStreaming =
		isStreaming || displayedLength < (msg.content?.length || 0);
	const textToRender = msg.content?.substring(0, displayedLength) || "";

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

	const preprocessedText = preprocessCitations(
		textToRender +
			(isVisuallyStreaming ? " [glow-cursor](#glow-cursor)" : ""),
	);

	const components = React.useMemo(
		() => ({
			p: ({ node, children, ...props }: any) => (
				<StreamingBlock Component="p" {...props}>
					{children}
				</StreamingBlock>
			),
			li: ({ node, children, ...props }: any) => (
				<StreamingBlock Component="li" {...props}>
					{children}
				</StreamingBlock>
			),
			h3: ({ node, children, ...props }: any) => (
				<StreamingBlock Component="h3" {...props}>
					{children}
				</StreamingBlock>
			),
			h4: ({ node, children, ...props }: any) => (
				<StreamingBlock Component="h4" {...props}>
					{children}
				</StreamingBlock>
			),
			a: ({ href, children }: any) => {
				if (href === "#glow-cursor") {
					return <GlowCursor key="glow-cursor" />;
				}
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
		}),
		[msg.citations, onCitationClick],
	);

	const keyProvisionsComponents = React.useMemo(
		() => ({
			...components,
			ul: ({ node, children, ...props }: any) => (
				<motion.ul
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {},
						visible: { transition: { staggerChildren: 0.15 } },
					}}
					{...props}
				>
					{children}
				</motion.ul>
			),
			li: ({ node, children, ...props }: any) => (
				<motion.li
					variants={{
						hidden: { opacity: 0, y: 10 },
						visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
					}}
					{...props}
				>
					{children}
				</motion.li>
			),
		}),
		[components],
	);

	if (!textToRender) return null;

	return (
		<div className="prose font-serif prose-emerald dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-200 text-sm leading-relaxed">
			<ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
				{preprocessedText}
			</ReactMarkdown>
			{msg.key_provisions && msg.key_provisions.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="mt-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg"
				>
					<h4 className="text-emerald-800 dark:text-emerald-400 font-semibold mb-2 flex items-center">
						<Scale className="w-4 h-4 mr-2" />
						Key Provisions
					</h4>
					<div className="text-zinc-700 dark:text-zinc-300 [&>ul]:mb-0 [&>ul]:mt-2 [&>ul>li]:my-1">
						<ReactMarkdown
							components={keyProvisionsComponents}
							remarkPlugins={[remarkGfm]}
						>
							{preprocessCitations(msg.key_provisions.join("\n"))}
						</ReactMarkdown>
					</div>
				</motion.div>
			)}
		</div>
	);
}
