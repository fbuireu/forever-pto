import enMessages from "@i18n/messages/en.json";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
const currentPathname = vi.hoisted(() => ({ value: "/planner" }));
const currentLocale = vi.hoisted(() => ({ value: "es" }));

vi.mock("@application/i18n/navigation", () => ({
	useRouter: () => ({ push }),
	usePathname: () => currentPathname.value,
}));

vi.mock("next-intl", () => ({
	useLocale: () => currentLocale.value,
	useTranslations: () => (key: string, values: Record<string, string>) => `${key}:${JSON.stringify(values ?? {})}`,
}));

vi.mock("@ui/hooks/useLanguages", () => ({
	useLanguages: () => [
		{ code: "en", label: "English" },
		{ code: "es", label: "Espanol" },
	],
}));

import { useLanguageSwitch } from "./useLanguageSwitch";

beforeEach(() => {
	vi.clearAllMocks();
	currentPathname.value = "/planner";
	currentLocale.value = "es";
});

describe("useLanguageSwitch", () => {
	it("pushes the pathname it was given, because next-intl has already stripped the locale prefix", () => {
		renderHook(() => useLanguageSwitch()).result.current.selectLanguage("en");

		expect(push).toHaveBeenCalledWith("/planner", { locale: "en", scroll: false });
	});

	it("does not rewrite a path segment that merely looks like a locale", () => {
		currentPathname.value = "/es-guide";
		renderHook(() => useLanguageSwitch()).result.current.selectLanguage("en");

		expect(push).toHaveBeenCalledWith("/es-guide", { locale: "en", scroll: false });
	});

	it("resolves the current language from the active locale", () => {
		expect(renderHook(() => useLanguageSwitch()).result.current.currentLanguage).toEqual({
			code: "es",
			label: "Espanol",
		});
	});

	it("names the switcher after the language currently in force", () => {
		expect(renderHook(() => useLanguageSwitch()).result.current.switcherLabel).toContain("Espanol");
	});

	it("falls back to the locale code when the language list does not carry it", () => {
		currentLocale.value = "pt";

		const { switcherLabel, currentLanguage } = renderHook(() => useLanguageSwitch()).result.current;

		expect(currentLanguage).toBeUndefined();
		expect(switcherLabel).toContain("pt");
	});
});

describe("the a11y key the label is built from", () => {
	it("exists in the real bundle, so the mocked translator is not covering a missing key", () => {
		expect(enMessages.a11y.selectLanguage).toBeDefined();
	});
});
