"use client";

import { Button } from "@modules/components/core/button/Button";
import { DialogTrigger } from "@modules/components/core/dialog/atoms/dialogTrigger/DialogTrigger";
import { Dialog } from "@modules/components/core/dialog/Dialog";
import { ContactModal } from "@modules/components/home/components/devFooter/atoms/contactModal/ContactModal";
import { useEffect, useState } from "react";

const EMOJIS = ["☕", "🍺", "❤️", "🚀", "⚡", "🔥", "💻", "🌮", "🍕", "🎵", "🎮", "😴", "🤯", "💡"];

export const DevFooter = () => {
	const [currentEmoji, setCurrentEmoji] = useState(EMOJIS.at(0));
	const [isContactOpen, setIsContactOpen] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	const handleEmojiClick = () => setCurrentEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);

	return (
		<footer className="w-full border-t bg-background/50 backdrop-blur-sm">
			<div className="container mx-auto px-4 py-6">
				<div className="flex flex-col items-center justify-center space-y-2">
					<p className="text-sm text-muted-foreground text-center">
						Made with{" "}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleEmojiClick}
							className="inline-flex items-center justify-center w-6 h-6 text-lg hover:scale-125 transition-transform cursor-pointer select-none p-0 min-w-0"
							title="Click for a different emoji!"
							aria-label="Change emoji"
						>
							{currentEmoji}
						</Button>{" "}
						by{" "}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								window.open("https://github.com/fbuireu", "_blank", "noopener,noreferrer");
							}}
							className="font-medium text-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-4 cursor-pointer p-0 h-auto min-w-0"
						>
							Ferran Buireu
						</Button>
						{" · "}
						<Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
							<DialogTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="font-medium text-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-4 cursor-pointer p-0 h-auto min-w-0"
								>
									Contact
								</Button>
							</DialogTrigger>
							<ContactModal />
						</Dialog>
					</p>
					<div className="flex items-center space-x-1 text-xs text-muted-foreground/70">
						<span>Powered by procrastination and</span>
						<span className="inline-flex space-x-1">
							{EMOJIS.slice(0, 4).map((emoji) => (
								<span key={emoji} className="opacity-60">
									{emoji}
								</span>
							))}
						</span>
					</div>
				</div>
			</div>
		</footer>
	);
};
