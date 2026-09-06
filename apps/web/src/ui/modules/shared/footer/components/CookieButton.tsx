"use client";

import { useTranslations } from "next-intl";

export const CookieButton = () => {
	const t = useTranslations("footer");

	const showCookiePreferences = () => {
		globalThis.dispatchEvent(new CustomEvent("cc:showPreferences"));
	};

	return (
		<button
			type="button"
			className="text-sm font-medium px-1.5 py-0.5 quiet-link cursor-pointer"
			onClick={showCookiePreferences}
		>
			{t("manageCookies")}
		</button>
	);
};
