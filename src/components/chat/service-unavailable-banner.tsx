"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudOff, RefreshCw } from "lucide-react";

interface ServiceUnavailableBannerProps {
	onRetry?: () => void;
	retryIntervalSeconds?: number;
}

export const ServiceUnavailableBanner: React.FC<ServiceUnavailableBannerProps> = ({
	onRetry,
	retryIntervalSeconds = 30,
}) => {
	const [countdown, setCountdown] = useState(retryIntervalSeconds);
	const [isRetrying, setIsRetrying] = useState(false);

	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					handleManualRetry();
					return retryIntervalSeconds;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [retryIntervalSeconds]);

	const handleManualRetry = async () => {
		setIsRetrying(true);
		if (onRetry) {
			try {
				await onRetry();
			} finally {
				setIsRetrying(false);
				setCountdown(retryIntervalSeconds);
			}
		} else {
			window.location.reload();
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -12, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -12, scale: 0.98 }}
			transition={{ duration: 0.35, ease: "easeOut" }}
			className="mx-auto my-3 w-full max-w-3xl px-4"
		>
			<div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/30 backdrop-blur-md p-4 shadow-lg shadow-amber-500/5">
				{/* Top subtle highlight bar */}
				<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="flex items-start gap-3">
						<div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
							<CloudOff className="w-5 h-5" />
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
									Cloud Services Starting Up
								</h4>
								<span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
									Auto-reconnecting in {countdown}s
								</span>
							</div>
							<p className="text-xs text-amber-800/80 dark:text-amber-300/70 leading-relaxed">
								The cloud database or backend is currently waking from sleep (inactivity pause).
								This typically takes 30–60 seconds.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 self-end sm:self-center shrink-0">
						<button
							type="button"
							onClick={handleManualRetry}
							disabled={isRetrying}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-zinc-950 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
						>
							<RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
							{isRetrying ? "Checking..." : "Retry Now"}
						</button>
					</div>
				</div>
			</div>
		</motion.div>
	);
};
