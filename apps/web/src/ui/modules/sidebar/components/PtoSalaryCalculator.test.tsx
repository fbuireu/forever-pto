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

describe("the salary calculator's fields in the visitor's own language", () => {
	const inLocale = (locale: string) => {
		intl.locale = locale;
		return renderCalculator({ locale: locale as Locale, messages: BUNDLES[locale] as typeof en });
	};

	it.each([
		["en", "50,400", "€1000", "€200", "€25.00"],
		["es", "50.400", "1000€", "200€", "25.00€"],
		["ca", "50.400", "1000€", "200€", "25.00€"],
		["it", "50.400", "1000€", "200€", "25.00€"],
		["de", "50.400", "1000€", "200€", "25.00€"],
		["fr", "50 400", "1000€", "200€", "25.00€"],
	])(
		"reads the salary %s %j as fifty thousand four hundred",
		async (locale, typed, unusedValue, dailyRate, hourlyRate) => {
			const user = userEvent.setup();
			const input = inLocale(locale);

			await user.type(input, typed);

			expect(text()).toContain(unusedValue);
			expect(text()).toContain(dailyRate);
			expect(text()).toContain(hourlyRate);
		},
	);

	it.each([
		["en", "2.5"],
		["es", "2,5"],
		["de", "2,5"],
	])("reads %s %j unused days as two and a half, which the effective rate shows", async (locale, days) => {
		const user = userEvent.setup();
		const input = inLocale(locale);
		await user.type(input, locale === "en" ? "50,400" : "50.400");

		await user.clear(unusedDays());
		await user.type(unusedDays(), days);

		expect(text()).toContain(locale === "en" ? "€24.75" : "24.75€");
	});

	it.each([
		["en", "2.5", "2.5 extra unpaid days"],
		["es", "2,5", "2,5 días de más"],
		["ca", "2,5", "2,5 dies extra"],
		["it", "2,5", "2,5 giorni extra"],
		["de", "2,5", "2,5 zusätzlichen"],
		["fr", "2,5", "2,5 jours supplémentaires"],
	])("echoes %s unused days %j with the language's own decimal mark", async (locale, days, echoed) => {
		const user = userEvent.setup();
		const input = inLocale(locale);
		await user.type(input, locale === "en" ? "50,400" : locale === "fr" ? "50 400" : "50.400");

		await user.clear(unusedDays());
		await user.type(unusedDays(), days);

		expect(text()).toContain(echoed);
	});

	it("shows the starting five unused days as the language writes them", () => {
		inLocale("es");

		expect(unusedDays().value).toBe("5");
	});

	it("reads the other language's decimal separator in the unused days too", async () => {
		const user = userEvent.setup();
		const input = inLocale("es");
		await user.type(input, "50.400");

		await user.clear(unusedDays());
		await user.type(unusedDays(), "2.5");

		expect(text()).toContain("24.75€");
	});

	it("counts what it cannot read in the salary as an emptied field: no figures, and nothing reported", async () => {
		track.mockClear();
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, ".");

		expect(screen.queryByText(copy.valueOfUnusedPto)).toBeNull();
		expect(track).not.toHaveBeenCalled();
	});

	it("leaves a field empty once it is left holding what it cannot read", async () => {
		const user = userEvent.setup();
		const input = inLocale("es");

		await user.type(input, "1.2.3");
		await user.tab();

		expect(input.value).toBe("");
		expect(screen.queryByText(copy.valueOfUnusedPto)).toBeNull();
	});

	it("counts unreadable unused days as none, keeping the rates and dropping the opportunity cost", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();
		await user.type(input, "50400");

		await user.clear(unusedDays());
		await user.type(unusedDays(), ",");

		expect(screen.queryByText(copy.opportunityCost)).toBeNull();
		expect(screen.getByText(copy.yourDailyRate)).toBeTruthy();
	});

	it("names both fields in the visitor's language, as number fields", () => {
		const input = renderCalculator();

		expect(input.getAttribute("aria-roledescription")).toBe(en.a11y.numberField);
		expect(unusedDays().getAttribute("aria-roledescription")).toBe(en.a11y.numberField);
	});

	it("steps the salary by a thousand and the unused days by one, with the arrow keys", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();
		await user.type(input, "50400");

		await user.keyboard("{ArrowUp}");
		expect(input.value).toBe("51,000");

		await user.click(unusedDays());
		await user.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}");
		expect(unusedDays().value).toBe("6");

		await user.keyboard("{End}");
		expect(unusedDays().value).toBe("50");

		await user.keyboard("{Home}");
		expect(unusedDays().value).toBe("0");
	});

	it("keeps the group's left padding on the salary, which has a currency before it, and none on the unused days", () => {
		const input = renderCalculator();

		expect(input.className).toContain("pl-2");
		expect(unusedDays().className).not.toContain("pl-2");
	});

	it("offers the numeric keypad on both fields", () => {
		const input = renderCalculator();

		expect(input.getAttribute("inputmode")).toBe("numeric");
		expect(unusedDays().getAttribute("inputmode")).toBe("numeric");
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
