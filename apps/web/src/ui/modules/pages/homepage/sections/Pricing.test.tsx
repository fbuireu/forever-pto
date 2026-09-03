import { AMOUNT_MIN } from "@application/dto/payment/schema";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());
const mockGetLocale = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations, getLocale: mockGetLocale }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@ui/modules/core/primitives/Button", () => ({
	Button: ({ children }: { children: ReactNode }) => <>{children}</>,
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

const renderPricing = async ({ locale, messages }: RenderPricingParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	mockGetLocale.mockResolvedValue(locale);
	const { container } = render(await Pricing());
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
		expect(text).toContain(pricing.lifetimePrice.replace("{amount}", `€${AMOUNT_MIN}`));
	});

	it("counts the strategies through the message rather than hardcoding the digit in the copy", async () => {
		expect(await renderPricing({ locale: "en", messages: enMessages })).toContain(
			pricing.freeFeatures.threeStrategies.replace("{count}", "3"),
		);
	});

	it("starts the free plan in the planner and the supporter plan in the donation flow", async () => {
		await renderPricing({ locale: "en", messages: enMessages });

		expect(screen.getByRole("link", { name: pricing.freeCta }).getAttribute("href")).toBe("/planner");
		expect(screen.getByRole("button", { name: pricing.lifetimeCta })).toBeDefined();
	});

	it("lists every feature of both plans", async () => {
		await renderPricing({ locale: "en", messages: enMessages });
		const [free, lifetime] = screen
			.getAllByRole("list")
			.map((list) => [...list.querySelectorAll("li")].map((item) => (item.textContent ?? "").replace("✓", "").trim()));

		expect(free).toEqual(Object.values(pricing.freeFeatures).map((text) => text.replace("{count}", "3")));
		expect(lifetime).toEqual(Object.values(pricing.lifetimeFeatures));
	});
});
