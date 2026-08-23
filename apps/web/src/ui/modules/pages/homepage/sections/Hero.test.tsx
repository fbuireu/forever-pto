import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import frMessages from "@i18n/messages/fr.json";
import { render } from "@testing-library/react";
import { createFormatter, createTranslator, type Locale } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());
const mockGetFormatter = vi.hoisted(() => vi.fn());
const mockGetLocale = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getFormatter: mockGetFormatter,
	getLocale: mockGetLocale,
}));

vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@ui/modules/core/primitives/Button", () => ({
	Button: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@ui/modules/core/primitives/FlagIcon", () => ({ FlagIcon: () => null }));
vi.mock("@ui/utils/getCurrentYear", () => ({ getCurrentYear: vi.fn().mockResolvedValue(2026) }));

import { Hero } from "./Hero";

const NON_BREAKING_SPACES = /[  ]/g;

interface RenderHeroParams {
	locale: Locale;
	messages: typeof enMessages;
}

const renderHero = async ({ locale, messages }: RenderHeroParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
	mockGetLocale.mockResolvedValue(locale);
	const { container } = render(await Hero());
	return (container.textContent ?? "").replace(NON_BREAKING_SPACES, " ");
};

describe("Hero social proof", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("groups the user count with the German convention", async () => {
		expect(await renderHero({ locale: "de", messages: deMessages })).toContain("12.847");
	});

	it("groups the user count with the English convention", async () => {
		expect(await renderHero({ locale: "en", messages: enMessages })).toContain("12,847");
	});

	it("groups the user count with the French convention", async () => {
		const text = await renderHero({ locale: "fr", messages: frMessages });
		expect(text).toContain("12 847");
		expect(text).not.toContain("12.847");
	});

	it("formats the rating with the locale decimal separator", async () => {
		expect(await renderHero({ locale: "fr", messages: frMessages })).toContain("4,9");
		expect(await renderHero({ locale: "en", messages: enMessages })).toContain("4.9");
	});
});
