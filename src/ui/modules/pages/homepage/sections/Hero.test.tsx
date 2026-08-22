import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import frMessages from "@i18n/messages/fr.json";
import { render } from "@testing-library/react";
import { createFormatter, createTranslator } from "next-intl";
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

const renderHero = async (locale: string, messages: typeof enMessages) => {
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
		expect(await renderHero("de", deMessages)).toContain("12.847");
	});

	it("groups the user count with the English convention", async () => {
		expect(await renderHero("en", enMessages)).toContain("12,847");
	});

	it("groups the user count with the French convention", async () => {
		const text = await renderHero("fr", frMessages);
		expect(text).toContain("12 847");
		expect(text).not.toContain("12.847");
	});

	it("formats the rating with the locale decimal separator", async () => {
		expect(await renderHero("fr", frMessages)).toContain("4,9");
		expect(await renderHero("en", enMessages)).toContain("4.9");
	});
});
