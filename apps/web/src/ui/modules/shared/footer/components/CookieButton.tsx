"use client";

import { Button } from "@ui/modules/core/primitives/Button";
import { useTranslations } from "next-intl";

export const CookieButton = () => {
	const t = useTranslations("footer");

	const showCookiePreferences = () => {
		globalThis.dispatchEvent(new CustomEvent("cc:showPreferences"));
	};

	return (
		<Button
			variant="ghost"
			className="text-sm font-medium px-1.5 py-0.5 h-auto quiet-link hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] hover:border-[var(--frame)]"
			onClick={showCookiePreferences}
		>
			{t("manageCookies")}
		</Button>
	);
};
