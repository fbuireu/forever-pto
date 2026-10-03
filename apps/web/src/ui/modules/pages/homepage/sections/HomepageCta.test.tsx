import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@ui/modules/shared/QuickStartTrigger", () => ({
	QuickStartTrigger: ({ children, source }: { children: ReactNode; source: string }) => (
		<button type="button" data-testid="quick-start-trigger" data-source={source}>
			{children}
		</button>
	),
}));
vi.mock("./CtaShapesClient", () => ({
	CtaShapesClient: (props: Record<string, string>) => (
		<ul>
			{Object.entries(props).map(([shape, label]) => (
				<li key={shape} data-shape={shape}>
					{label}
				</li>
			))}
		</ul>
	),
}));

import { HomepageCta } from "./HomepageCta";

const closing = enMessages.homepage.closing;

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderCtaParams {
	locale?: Locale;
	messages?: typeof enMessages;
}

const renderCta = async ({ locale = "en", messages = enMessages }: RenderCtaParams = {}) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	return render(await HomepageCta());
};

describe("HomepageCta", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("opens the quick start from the call to action rather than linking straight into the planner", async () => {
		await renderCta();

		expect(screen.getByTestId("quick-start-trigger").getAttribute("data-source")).toBe("closing");
		expect(screen.getByTestId("quick-start-trigger").textContent).toBe(closing.cta);
		expect(screen.queryByRole("link", { name: closing.cta })).toBeNull();
	});

	it("hands the floating shapes their translated labels, one per shape", async () => {
		const { container } = await renderCta();
		const shapes = Object.fromEntries(
			[...container.querySelectorAll("[data-shape]")].map((item) => [
				item.getAttribute("data-shape"),
				item.textContent,
			]),
		);

		expect(shapes).toEqual(closing.shapes);
	});

	it("draws the title from one message, the emphasis and the line break where the translation puts them", async () => {
		await renderCta();
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.textContent).toBe("Your next freeyear starts today.");
		expect(heading.querySelector("em")?.textContent).toBe("free");
		expect(heading.querySelector("em + br")).not.toBeNull();
	});

	it.each(Object.entries(BUNDLES))(
		"renders the %s title with its emphasis and its line break",
		async (locale, messages) => {
			await renderCta({ locale: locale as Locale, messages });
			const heading = screen.getByRole("heading", { level: 2 });

			expect(heading.querySelector("em")?.textContent).toMatch(/\S/);
			expect(heading.querySelector("br")).not.toBeNull();
			expect(heading.textContent).not.toMatch(/[<>{}]|homepage\./);
		},
	);
});
