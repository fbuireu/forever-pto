import { readFileSync } from "node:fs";
import { join } from "node:path";
import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@ui/modules/shared/Header", () => ({ Header: vi.fn().mockReturnValue(null) }));
vi.mock("@ui/modules/shared/footer/Footer", () => ({ Footer: vi.fn().mockReturnValue(null) }));

import { NotFoundContent } from "./NotFoundContent";

const notFound = enMessages.notFound;

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderNotFoundParams {
	locale?: Locale;
	messages?: typeof enMessages;
}

const renderNotFound = async ({ locale = "en", messages = enMessages }: RenderNotFoundParams = {}) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "notFound" }));
	return render(await NotFoundContent({ locale }));
};

const hrefOf = (label: string) =>
	screen
		.getAllByRole("link")
		.find((link) => link.textContent?.includes(label))
		?.getAttribute("href");

beforeEach(() => {
	vi.clearAllMocks();
});

describe("NotFoundContent", () => {
	it("reads its copy for the locale it was handed", async () => {
		await renderNotFound({ locale: "de", messages: deMessages });

		expect(mockGetTranslations).toHaveBeenCalledExactlyOnceWith({ locale: "de", namespace: "notFound" });
	});

	it("sends the reader home and into the planner", async () => {
		await renderNotFound();

		expect(hrefOf(notFound.ctaPrimary)).toBe("/");
		expect(hrefOf(notFound.ctaPlanner)).toBe("/planner");
	});

	it("points each suggestion at the homepage section its label names", async () => {
		await renderNotFound();

		expect(hrefOf(notFound.link1)).toBe("/#how");
		expect(hrefOf(notFound.link2)).toBe("/#features");
		expect(hrefOf(notFound.link3)).toBe("/#pricing");
		expect(hrefOf(notFound.link4)).toBe("/#faq");
	});

	it("draws the title from one message, with the highlight and the emphasis inside it", async () => {
		await renderNotFound();
		const heading = screen.getByRole("heading", { level: 1 });

		expect(heading.textContent).toBe("This page went on vacation without notice.");
		expect(heading.querySelector("span")?.textContent).toBe("vacation");
		expect(heading.querySelector("em")?.textContent).toBe("without notice.");
	});

	it.each(Object.entries(BUNDLES))("renders the %s page with every message resolved", async (locale, messages) => {
		const { container } = await renderNotFound({ locale: locale as Locale, messages });
		const [home, planner] = screen.getAllByRole("link");
		const heading = screen.getByRole("heading", { level: 1 });

		expect(heading.querySelector("span")?.textContent).toMatch(/\S/);
		expect(heading.querySelector("em")?.textContent).toMatch(/\S/);
		expect(container.textContent).not.toMatch(/[<>{}]|notFound\./);
		expect(home?.textContent).toMatch(/^← \S/);
		expect(planner?.textContent).toMatch(/\S →$/);
	});
});

describe("NotFoundContent's imports", () => {
	it("takes nothing from another screen's folder, its header included, which lives in shared/", () => {
		const source = readFileSync(join(__dirname, "NotFoundContent.tsx"), "utf8");

		expect(source).toContain('from "@ui/modules/shared/Header"');
		expect(source).not.toMatch(/@ui\/modules\/pages\/(?!not-found\/)/);
	});
});
