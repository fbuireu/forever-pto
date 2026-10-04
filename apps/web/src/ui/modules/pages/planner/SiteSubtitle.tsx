"use client";

import { useTutorial } from "@ui/hooks/useTutorial";
import { useTranslations } from "next-intl";

export const SiteSubtitle = () => {
	const t = useTranslations("planner");
	const { startTutorial } = useTutorial();

	return (
		<p className="mx-auto mt-2 mb-16 max-w-4xl px-5 py-4 text-center leading-relaxed text-muted-foreground">
			{t.rich("instructions", {
				tour: (chunks) => (
					<button
						type="button"
						onClick={startTutorial}
						className="cursor-pointer font-black text-foreground underline decoration-[2px] underline-offset-4 transition-colors hover:text-[var(--color-brand-purple-deep)]"
					>
						{chunks}
					</button>
				),
			})}
		</p>
	);
};
