"use client";

import { Button } from "@modules/components/core/button/Button";
import { Icon } from "@ui/modules/components/core/icon/Icon";
import { useTranslations } from "next-intl";
import { type MouseEvent, useEffect, useState } from "react";
import { CONTACT_DETAILS, EMOJIS, SOCIAL_NETWORKS } from "./const";

export const DevFooter = () => {
	const t = useTranslations("footer");
	const [currentEmoji, setCurrentEmoji] = useState(EMOJIS.at(0));

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	const handleEmojiClick = () => setCurrentEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);

	const handleMailTo = (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		if (!event.isTrusted) return;

		const to = atob(CONTACT_DETAILS.ENCODED_EMAIL_SELF);
		const mailParams = new URLSearchParams();

		mailParams.append("subject", CONTACT_DETAILS.EMAIL_SUBJECT);

		window.location.href = `mailto:${to}?${String(mailParams)}`;
	};

	return (
		<footer className="w-full border-t bg-background/50 backdrop-blur-sm">
			<div className="container mx-auto px-4 py-4">
				<div className="flex flex-col items-center justify-center space-y-2">
					<p className="text-sm text-muted-foreground text-center">
						{t("madeWith")}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleEmojiClick}
							className="inline-flex items-center justify-center w-6 h-6 text-lg hover:scale-125 transition-transform cursor-pointer select-none p-0 min-w-0"
							title={t("emojiClickTooltip")}
							aria-label={t("emojiClickTooltip")}
						>
							{currentEmoji}
						</Button>{" "}
						{t("by")}{" "}
						<span className="font-medium text-foreground hover:text-primary p-0 h-auto min-w-0">
							{CONTACT_DETAILS.NAME}
						</span>
						{" · "}
						<Button
							onClick={handleMailTo}
							variant="ghost"
							size="sm"
							className="font-medium text-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-4 cursor-pointer p-0 h-auto min-w-0"
						>
							{t("contact")}
						</Button>
					</p>
					<p className="text-sm text-muted-foreground text-center mt-2 mb-2">{t("youCanAlsoFindMe")}</p>
					<div className="flex gap-5 items-center space-x-1 text-xs text-muted-foreground/70">
						{Object.values(SOCIAL_NETWORKS).map((network) => (
							<a key={network.BASE_URL} href={`${network.BASE_URL}/${network.USERNAME}`}>
								<Icon icon={network.ICON} size={32} className="hover:scale-110 transition-transform" />
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
};
