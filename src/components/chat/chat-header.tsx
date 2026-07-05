import React, { useRef } from "react";
import { flushSync } from "react-dom";
import { Trash2, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ChatHeaderProps {
	threadId: string;
	theme: string | undefined;
	setTheme: (theme: string) => void;
	mounted: boolean;
	onClearChat: () => void;
	title?: string;
	onMenuClick?: () => void;
}

export function ChatHeader({
	threadId,
	theme,
	setTheme,
	mounted,
	onClearChat,
	title,
	onMenuClick,
}: ChatHeaderProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);

	const toggleTheme = () => {
		const targetTheme = theme === "dark" ? "light" : "dark";
		const doc = document as any;

		if (!doc.startViewTransition) {
			setTheme(targetTheme);
			return;
		}

		const button = buttonRef.current;
		if (!button) {
			setTheme(targetTheme);
			return;
		}

		const { top, left, width, height } = button.getBoundingClientRect();
		const x = left + width / 2;
		const y = top + height / 2;

		const right = window.innerWidth - x;
		const bottom = window.innerHeight - y;
		const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

		const transition = doc.startViewTransition(() => {
			flushSync(() => {
				setTheme(targetTheme);
			});
		});

		transition.ready.then(() => {
			const clipPath = [
				`circle(0px at ${x}px ${y}px)`,
				`circle(${maxRadius}px at ${x}px ${y}px)`,
			];

			document.documentElement.animate(
				{
					clipPath: clipPath,
				},
				{
					duration: 450,
					easing: "ease-in-out",
					pseudoElement: "::view-transition-new(root)",
				},
			);
		});
	};

	return (
		<header className="h-14 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between">
			<div className="flex items-center space-x-2 overflow-hidden mr-2">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onMenuClick}
					className="md:hidden h-8 w-8 p-0 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
					title="Open Menu"
				>
					<Menu className="w-4 h-4" />
				</Button>
				<div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 hidden sm:block" />
				<span className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase flex items-center space-x-1.5 overflow-hidden">
					<span className="hidden sm:inline shrink-0">Thread:</span>
					<span className="text-zinc-950 dark:text-zinc-200 normal-case font-mono inline-flex overflow-hidden max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-md truncate">
						<AnimatePresence mode="popLayout" initial={false}>
							<motion.div
								key={title || threadId}
								initial="hidden"
								animate="visible"
								exit="hidden"
								variants={{
									hidden: { opacity: 0 },
									visible: {
										opacity: 1,
										transition: { staggerChildren: 0.02 },
									},
								}}
								className="inline-flex"
							>
								{(title || threadId)
									.split("")
									.map((char, index) => (
										<motion.span
											key={index}
											variants={{
												hidden: {
													opacity: 0,
													y: 0,
													scale: 0.8,
												},
												visible: {
													opacity: 1,
													y: 0,
													scale: 1,
												},
											}}
											className="inline-block whitespace-pre"
										>
											{char}
										</motion.span>
									))}
							</motion.div>
						</AnimatePresence>
					</span>
				</span>
			</div>

			<div className="flex items-center space-x-2">
				{/* Dynamic Light/Dark Mode Toggle with slide/rotate transitions */}
				{mounted && (
					<Button
						ref={buttonRef}
						variant="outline"
						size="sm"
						onClick={toggleTheme}
						className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 overflow-hidden relative"
						title="Toggle Theme"
					>
						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={theme}
								initial={{ y: -15, opacity: 0, rotate: -45 }}
								animate={{ y: 0, opacity: 1, rotate: 0 }}
								exit={{ y: 15, opacity: 0, rotate: 45 }}
								transition={{
									duration: 0.15,
									ease: "easeInOut",
								}}
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
					onClick={onClearChat}
					className="text-xs border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-950/30 text-zinc-500 dark:text-zinc-400 transition-colors"
				>
					<Trash2 className="w-3.5 h-3.5 mr-1" />
					Delete Chat
				</Button>
			</div>
		</header>
	);
}
