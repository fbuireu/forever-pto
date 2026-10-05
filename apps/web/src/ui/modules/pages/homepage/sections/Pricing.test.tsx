import { AMOUNT_MIN } from "@application/dto/payment/schema";
import { Strategy } from "@domain/calendar/types";
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
const mockGetLocale = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations, getLocale: mockGetLocale }));
vi.mock("@application/dto/payment/schema", async (importOriginal) => ({
	...(await importOriginal<typeof import("@application/dto/payment/schema")>()),
	AMOUNT_MIN: 7,
}));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@ui/modules/shared/QuickStartTrigger", () => ({
	QuickStartTrigger: ({ children, className, source }: { children: ReactNode; className?: string; source: string }) => (
		<button type="button" data-testid="quick-start-trigger" className={className} data-source={source}>
			{children}
		</button>
	),
}));
vi.mock("@ui/modules/shared/SupportButton", () => ({
	SupportButton: ({ label, className }: { label: string; className?: string }) => (
		<button type="button" className={className}>
			{label}
		</button>
	),
}));

import { Pricing } from "./Pricing";

const NON_BREAKING_SPACES = /[\u202F\u00A0]/g;
const pricing = enMessages.homepage.pricing;

interface RenderPricingParams {
	locale: Locale;
	messages: typeof enMessages;
}

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

const mountPricing = async ({ locale, messages }: RenderPricingParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	mockGetLocale.mockResolvedValue(locale);
	return render(await Pricing());
};

const renderPricing = async (params: RenderPricingParams) => {
	const { container } = await mountPricing(params);
	return (container.textContent ?? "").replace(NON_BREAKING_SPACES, " ");
};

describe("Pricing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("prints the free price in the locale's currency layout, symbol first in English and last in German", async () => {
		expect(await renderPricing({ locale: "en", messages: enMessages })).toContain("€0/always");
		expect(await renderPricing({ locale: "de", messages: deMessages })).toContain("0 €");
	});

	it("quotes the same donation floor the payment schema enforces", async () => {
		const text = await renderPricing({ locale: "en", messages: enMessages });

		expect(text).toContain(pricing.lifetimeTagline.replace("{amount}", `€${AMOUNT_MIN}`));
		expect(text).toContain(pricing.lifetimePrice.replace("{amount}", `€${AMOUNT_MIN}`).replace(/<\/?per>/g, ""));
	});

	it.each(Object.entries(BUNDLES))(
		"prints each %s price with its period from one message",
		async (locale, messages) => {
			const { container } = await mountPricing({ locale: locale as Locale, messages });
			const prices = [...container.querySelectorAll(".text-\\[64px\\]")];

			expect(prices).toHaveLength(2);
			for (const price of prices) {
				expect(price.querySelector("span")?.textContent).toMatch(/\S/);
				expect(price.textContent).not.toMatch(/[<>{}]|homepage\./);
			}
		},
	);

	it("counts the strategies through the message rather than hardcoding the digit in the copy", async () => {
		expect(await renderPricing({ locale: "en", messages: enMessages })).toContain(
			pricing.freeFeatures.strategies.replace("{count}", String(Object.values(Strategy).length)),
		);
	});

	it("starts the free plan through the quick start and the supporter plan in the donation flow", async () => {
		await renderPricing({ locale: "en", messages: enMessages });

		expect(screen.getByTestId("quick-start-trigger").getAttribute("data-source")).toBe("pricing");
		expect(screen.getByTestId("quick-start-trigger").textContent).toBe(pricing.freeCta);
		expect(screen.queryByRole("link", { name: pricing.freeCta })).toBeNull();
		expect(screen.getByRole("button", { name: pricing.lifetimeCta })).toBeDefined();
	});

	it("lists every feature of both plans", async () => {
		await renderPricing({ locale: "en", messages: enMessages });
		const [free, lifetime] = screen
			.getAllByRole("list")
			.map((list) => [...list.querySelectorAll("li")].map((item) => (item.textContent ?? "").replace("✓", "").trim()));

		expect(free).toEqual(
			Object.values(pricing.freeFeatures).map((text) =>
				text.replace("{count}", String(Object.values(Strategy).length)),
			),
		);
		expect(lifetime).toEqual(Object.values(pricing.lifetimeFeatures));
	});
});
