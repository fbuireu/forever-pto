import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const intl = vi.hoisted(() => ({ locale: "en" }));

vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: unknown) => unknown) => selector({ currencySymbol: "€", currency: "EUR" }),
}));

vi.mock("next-intl", () => ({
	useLocale: () => intl.locale,
	useTranslations: () =>
		Object.assign((key: string) => key, {
			rich: (key: string, values?: Record<string, unknown>) => {
				const amount = values?.amount;
				return typeof amount === "function" ? (
					<>
						{key}
						{amount("")}
					</>
				) : (
					key
				);
			},
		}),
}));

vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number, decimalPlaces = 0 }: { number: number; decimalPlaces?: number }) => (
		<span>{number.toFixed(decimalPlaces)}</span>
	),
}));

vi.mock("@ui/modules/sidebar/components/SidebarFieldLabel", () => ({
	SidebarFieldTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const { PtoSalaryCalculator } = await import("./PtoSalaryCalculator");

const renderCalculator = () => {
	const { container } = render(<PtoSalaryCalculator />);
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

		expect(screen.queryByText("valueOfUnusedPto")).toBeNull();
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

		expect(screen.getByText("effectiveHourlyRate")).toBeTruthy();
		expect(text()).toContain("€24.51");
		expect(screen.getByText("opportunityCost")).toBeTruthy();
	});

	it("drops the effective rate and the opportunity cost once no day goes unused, keeping the rates", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();
		await user.type(input, "50400");

		await user.clear(unusedDays());
		await user.type(unusedDays(), "0");

		expect(screen.queryByText("effectiveHourlyRate")).toBeNull();
		expect(screen.queryByText("opportunityCost")).toBeNull();
		expect(screen.getByText("yourDailyRate")).toBeTruthy();
		expect(text()).toContain("€0");
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
