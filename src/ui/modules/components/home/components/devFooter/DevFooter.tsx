"use client";

import { Button } from "@modules/components/core/button/Button";
import { Dialog } from "@modules/components/core/dialog/Dialog";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { DialogTitle } from "@modules/components/core/dialog/atoms/dialogTitle/DialogTitle";
import { DialogTrigger } from "@modules/components/core/dialog/atoms/dialogTrigger/DialogTrigger";
import { useEffect, useState } from "react";

export const DevFooter = () => {
	const emojis = ["☕", "🍺", "❤️", "🚀", "⚡", "🔥", "💻", "🌮", "🍕", "🎵", "🎮", "😴", "🤯", "💡"];
	const [currentEmoji, setCurrentEmoji] = useState(emojis[0]);
	const [isContactOpen, setIsContactOpen] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	const handleEmojiClick = () => setCurrentEmoji(emojis[Math.floor(Math.random() * emojis.length)]);

	// todo: isolate and make it work and add translations
	const ContactModal = () => (
		<DialogContent className="sm:max-w-md">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<span className="text-2xl">📬</span>
					Get in touch
				</DialogTitle>
			</DialogHeader>
			<div className="space-y-4 py-4">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">Found a bug? Have a feature request? Just want to say hi?</p>

					<div className="grid gap-3">
						<Button
							variant="outline"
							className="flex items-center justify-center gap-3 p-6 h-auto group"
							onClick={() => {}}
						>
							<span className="text-xl">📧</span>
							<div className="text-left">
								<div className="font-medium group-hover:text-primary transition-colors">Email</div>
								<div className="text-sm text-muted-foreground">Send me a message</div>
							</div>
						</Button>

						<Button
							variant="outline"
							className="flex items-center justify-center gap-3 p-6 h-auto group"
							onClick={() => {
								window.open("https://github.com/ferranbuireu", "_blank", "noopener,noreferrer");
							}}
						>
							<span className="text-xl">🐙</span>
							<div className="text-left">
								<div className="font-medium group-hover:text-primary transition-colors">GitHub</div>
								<div className="text-sm text-muted-foreground">@ferranbuireu</div>
							</div>
						</Button>

						<Button
							variant="outline"
							className="flex items-center justify-center gap-3 p-6 h-auto group"
							onClick={() => {
								window.open("https://twitter.com/ferranbuireu", "_blank", "noopener,noreferrer");
							}}
						>
							<span className="text-xl">🐦</span>
							<div className="text-left">
								<div className="font-medium group-hover:text-primary transition-colors">Twitter</div>
								<div className="text-sm text-muted-foreground">@ferranbuireu</div>
							</div>
						</Button>
					</div>

					<div className="pt-4 border-t">
						<p className="text-xs text-muted-foreground">
							Response time: Somewhere between ⚡ instant and 🐌 "I'll get back to you"
						</p>
					</div>
				</div>
			</div>
		</DialogContent>
	);

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
								window.open("https://github.com/ferranbuireu", "_blank", "noopener,noreferrer");
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
							{emojis.slice(0, 4).map((emoji) => (
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
