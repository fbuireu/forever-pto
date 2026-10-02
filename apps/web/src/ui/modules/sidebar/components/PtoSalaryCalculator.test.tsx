import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const intl = vi.hoisted(() => ({ locale: "en" }));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("next-intl", async (importOriginal) => ({
	...(await importOriginal<typeof import("next-intl")>()),
	useLocale: () => intl.locale,
}));

vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number, decimalPlaces = 0 }: { number: number; decimalPlaces?: number }) => (
		<span>{number.toFixed(decimalPlaces)}</span>
	),
}));

vi.mock("./SidebarFieldLabel", () => ({
	SidebarFieldTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const { PtoSalaryCalculator } = await import("./PtoSalaryCalculator");

const BUNDLES: Record<string, typeof en> = {
	en,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

const copy = en.ptoSalaryCalculator;

interface RenderCalculatorParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderCalculator = ({ locale = "en", messages = en }: RenderCalculatorParams = {}) => {
	const { container } = render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<PtoSalaryCalculator />
		</NextIntlClientProvider>,
	);
	return container.querySelector<HTMLInputElement>("#annualSalary") as HTMLInputElement;
};

const unusedDays = () => document.querySelector<HTMLInputElement>("#unusedPTO") as HTMLInputElement;

const text = () => document.body.textContent ?? "";

beforeEach(() => {
	intl.locale = "en";
});

describe("PtoSalaryCalculator", () => {
	it("mounts the salary field controlled and empty", () => {
		expect(renderCalculator().value).toBe("");
	});

	it("lets the salary field be emptied again instead of pinning it to 0", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50000");
		expect(input.value).toBe("50000");

		await user.clear(input);

		expect(input.value).toBe("");
	});

	it("shows no figures until there is a salary to derive them from", () => {
		renderCalculator();

		expect(screen.queryByText(copy.valueOfUnusedPto)).toBeNull();
	});

	it("prices the unused days at the daily rate over 252 working days", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50400");

		expect(text()).toContain("€1000");
		expect(text()).toContain("€200");
		expect(text()).toContain("€25.00");
	});

	it("shows what each hour was really worth once the unused days are counted as worked", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50400");

		expect(screen.getByText(copy.effectiveHourlyRate)).toBeTruthy();
		expect(text()).toContain("€24.51");
		expect(screen.getByText(copy.opportunityCost)).toBeTruthy();
	});

	it("drops the effective rate and the opportunity cost once no day goes unused, keeping the rates", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();
		await user.type(input, "50400");

		await user.clear(unusedDays());
		await user.type(unusedDays(), "0");

		expect(screen.queryByText(copy.effectiveHourlyRate)).toBeNull();
		expect(screen.queryByText(copy.opportunityCost)).toBeNull();
		expect(screen.getByText(copy.yourDailyRate)).toBeTruthy();
		expect(text()).toContain("€0");
	});

	it("lets the unused-days field be emptied too, and counts it as none until a number is typed", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();
		await user.type(input, "50400");

		await user.clear(unusedDays());

		expect(unusedDays().value).toBe("");
		expect(screen.queryByText(copy.effectiveHourlyRate)).toBeNull();
		expect(screen.getByText(copy.yourDailyRate)).toBeTruthy();
	});

	it("counts a partial number in the unused-days field as the number it starts", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();
		await user.type(input, "50400");

		await user.clear(unusedDays());
		await user.type(unusedDays(), "4.");

		expect(text()).toContain("€800");
	});

	it("writes the symbol after the amount for a locale that formats currency that way", async () => {
		intl.locale = "es";
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50400");

		expect(text()).toContain("1000€");
		expect(text()).not.toContain("€1000");
	});

	it("falls back to the symbol first when the locale cannot be formatted at all", async () => {
		intl.locale = "not a locale";
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50400");

		expect(text()).toContain("€1000");
	});
});

describe("PtoSalaryCalculator copy", () => {
	it.each(Object.entries(BUNDLES))(
		"renders the %s opportunity cost with the amount inside it",
		async (locale, messages) => {
			const user = userEvent.setup();
			const input = renderCalculator({ locale: locale as Locale, messages });

			await user.type(input, "50400");
			const description = screen.getByText(messages.ptoSalaryCalculator.opportunityCost).nextElementSibling;

			expect(description?.textContent).toContain("€1000");
			expect(description?.textContent).not.toMatch(/[<>{}]|ptoSalaryCalculator\./);
		},
	);
});

describe("PtoSalaryCalculator analytics", () => {
	it("reports the tool once, when figures first appear, and never the salary", async () => {
		track.mockClear();
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50400");

		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "tool_used", properties: { tool: "ptoSalaryCalculator" } });
		expect(JSON.stringify(track.mock.calls)).not.toContain("50400");
	});

	it("reports again when figures come back after the salary was emptied", async () => {
		track.mockClear();
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50400");
		await user.clear(input);
		await user.type(input, "100");

		expect(track).toHaveBeenCalledTimes(2);
	});
});
