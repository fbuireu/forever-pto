import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@ui/modules/core/animate/base/Accordion", () => ({
	Accordion: ({ children }: { children: ReactNode }) => <div data-slot="accordion">{children}</div>,
	AccordionItem: ({ children, value }: { children: ReactNode; value: string }) => (
		<div data-slot="accordion-item" data-value={value}>
			{children}
		</div>
	),
	AccordionTrigger: ({ children }: { children: ReactNode }) => <h3>{children}</h3>,
	AccordionPanel: ({ children }: { children: ReactNode }) => <div data-slot="accordion-panel">{children}</div>,
}));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@ui/modules/pages/homepage/support/FaqTabs", () => ({
	FaqTabs: ({ tabs }: { tabs: { id: string; title: string; content: ReactNode }[] }) => (
		<div>
			{tabs.map((tab) => (
				<section key={tab.id} aria-label={tab.title} data-tab={tab.id}>
					{tab.content}
				</section>
			))}
		</div>
	),
}));
vi.mock("@ui/modules/pages/homepage/support/Troubleshooting", () => ({
	Troubleshooting: () => (
		<button type="button" data-testid="troubleshooting">
			reset
		</button>
	),
}));

import { Faq } from "./Faq";

const sections = enMessages.faq.sections;

const questionsOf = (section: Record<string, string | { question: string }>) =>
	Object.values(section)
		.filter((entry): entry is { question: string } => typeof entry === "object")
		.map((entry) => entry.question);

const renderFaq = async () => {
	mockGetTranslations.mockImplementation(async (namespace: "faq" | "homepage") =>
		createTranslator({ locale: "en", messages: enMessages, namespace }),
	);
	const { container } = render(await Faq());
	return container;
};

describe("Faq", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("opens one tab per section, titled and ordered as the bundle lists them", async () => {
		const container = await renderFaq();
		const tabs = [...container.querySelectorAll("[data-tab]")];

		expect(tabs.map((tab) => tab.getAttribute("data-tab"))).toEqual([
			"general",
			"technical",
			"security",
			"collaborate",
		]);
		expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual(
			Object.values(sections).map((section) => section.title),
		);
	});

	it("asks every question the bundle carries, each inside its own section", async () => {
		const container = await renderFaq();

		for (const [id, section] of Object.entries(sections)) {
			const tab = container.querySelector(`[data-tab="${id}"]`) as HTMLElement;
			const asked = [...tab.querySelectorAll("h3")].map((heading) => heading.textContent);
			expect(asked).toEqual(questionsOf(section));
		}
	});

	it("links the data answer to the privacy policy inside the site, not in a new tab", async () => {
		await renderFaq();
		const link = screen.getByRole("link", { name: "privacy policy" });

		expect(link.getAttribute("href")).toBe("/legal/privacy-policy");
		expect(link.getAttribute("target")).toBeNull();
	});

	it("sends contributors to a GitHub issue form in a new tab, without leaking the opener", async () => {
		await renderFaq();
		const link = screen.getByRole("link", { name: "Open issues or merge requests" });

		expect(link.getAttribute("href")).toContain("https://github.com/fbuireu/forever-pto/issues/new");
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
	});

	it("answers the troubleshooting question with the reset control rather than with copy", async () => {
		const container = await renderFaq();
		const item = container.querySelector('[data-value="troubleshooting"]') as HTMLElement;

		expect(item.querySelector("h3")?.textContent).toBe(sections.security.troubleshooting.question);
		expect(item.querySelector('[data-testid="troubleshooting"]')).not.toBeNull();
	});
});
