"use client";

import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { Button } from "@ui/modules/core/primitives/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/modules/core/primitives/Card";
import { LazyContactModal } from "@ui/modules/shared/contact/LazyContactModal";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./contact.css";

const GITHUB_ISSUE_URL =
	"https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.yml&labels=enhancement";

export function Contact() {
	const t = useTranslations("roadmap");
	const [contactModalOpen, setContactModalOpen] = useState(false);

	useEffect(() => {
		if (globalThis.location.hash === "#contact") {
			setContactModalOpen(true);
			track({ event: "contact_opened", properties: { source: "hash" } });
		}
	}, []);

	return (
		<div id="contact" className="container max-w-4xl m-auto">
			<Card className="dashed-card group relative border-none shadow-none rounded-none">
				<svg
					className="absolute inset-0 w-full h-full pointer-events-none"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect
						x="0.5"
						y="0.5"
						width="calc(100% - 1px)"
						height="calc(100% - 1px)"
						fill="none"
						strokeWidth="2"
						strokeDasharray="20 12"
						strokeLinecap="round"
						rx="8"
					/>
				</svg>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">{t("haveSuggestion")}</CardTitle>
					<CardDescription>{t("feedbackShapes")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground px-3 py-2">
						{t.rich("ideaPrompt", {
							talk: (chunks) => (
								<Button
									variant="ghost"
									className="px-1.5 py-0.5 h-auto text-sm font-semibold hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground"
									onClick={() => {
										setContactModalOpen(true);
										track({ event: "contact_opened", properties: { source: "click" } });
									}}
								>
									{chunks}
								</Button>
							),
							issue: (chunks) => (
								<a
									href={GITHUB_ISSUE_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm font-semibold px-1.5 py-0.5 quiet-link"
								>
									{chunks}
								</a>
							),
						})}
					</div>
				</CardContent>
			</Card>
			<LazyContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
		</div>
	);
}
