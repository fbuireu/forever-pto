import { fireEvent, render, screen, within } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { MonthToggles } from "./MonthToggles";

interface RenderTogglesParams {
	locale?: Locale;
	months?: number[];
	reachable?: ReadonlySet<number>;
	carryOverMonths?: number;
}

const EVERY_MONTH: ReadonlySet<number> = new Set(Array.from({ length: 24 }, (_, position) => position));

const renderToggles = ({
	locale = "en",
	months = [6, 7],
	reachable = EVERY_MONTH,
	carryOverMonths = 0,
}: RenderTogglesParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale={locale} messages={{}}>
			<MonthToggles
				label="Months"
				window={{ year: 2026, carryOverMonths }}
				months={months}
				onChange={onChange}
				reachable={reachable}
			/>
		</NextIntlClientProvider>,
	);

	return onChange;
};

describe("MonthToggles", () => {
	it("offers the twelve months inside a group named by its legend, the chosen ones pressed", () => {
		renderToggles();

		const group = screen.getByRole("group", { name: "Months" });
		expect(within(group).getAllByRole("button")).toHaveLength(12);
		expect(screen.getByRole("button", { name: "July 2026" }).getAttribute("aria-pressed")).toBe("true");
		expect(screen.getByRole("button", { name: "January 2026" }).getAttribute("aria-pressed")).toBe("false");
	});

	it("heads the months with their year only when the window spans two", () => {
		renderToggles();

		expect(screen.queryByText("2026")).toBeNull();
	});

	it("names each month in the reader's locale", () => {
		renderToggles({ locale: "es" });

		expect(screen.getByRole("button", { name: "julio 2026" })).toBeDefined();
	});

	it("hands back the months with one added", () => {
		const onChange = renderToggles();

		fireEvent.click(screen.getByRole("button", { name: "March 2026" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([6, 7, 2]);
	});

	it("hands back the months with one removed", () => {
		const onChange = renderToggles();

		fireEvent.click(screen.getByRole("button", { name: "July 2026" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([7]);
	});

	it("refuses a month the plan can no longer reach, and does not show it as chosen", () => {
		const onChange = renderToggles({ months: [2, 7], reachable: new Set([8, 9, 10, 11]) });

		const march = screen.getByRole("button", { name: "March 2026" });
		expect(march).toHaveProperty("disabled", true);
		expect(march.getAttribute("aria-pressed")).toBe("false");
		expect(screen.getByRole("button", { name: "August 2026" }).getAttribute("aria-pressed")).toBe("false");

		fireEvent.click(march);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("keeps an unreachable choice when another month is toggled, so it returns once past days are allowed", () => {
		const onChange = renderToggles({ months: [2], reachable: new Set([8, 9, 10, 11]) });

		fireEvent.click(screen.getByRole("button", { name: "October 2026" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([2, 9]);
	});

	it("adds the Carry-over Months after December, as the months of the next year they are", () => {
		const onChange = renderToggles({ carryOverMonths: 2 });

		const group = screen.getByRole("group", { name: "Months" });
		const buttons = within(group).getAllByRole("button");
		expect(buttons).toHaveLength(14);
		expect(buttons.at(-2)?.getAttribute("aria-label")).toBe("January 2027");
		expect(buttons.at(-2)?.textContent).toBe("Jan");
		expect(within(group).getByText("2027")).toBeDefined();

		fireEvent.click(screen.getByRole("button", { name: "January 2027" }));
		expect(onChange).toHaveBeenCalledExactlyOnceWith([6, 7, 12]);
	});

	it("tells a January of the chosen year from the next one", () => {
		renderToggles({ months: [12], carryOverMonths: 1 });

		expect(screen.getByRole("button", { name: "January 2026" }).getAttribute("aria-pressed")).toBe("false");
		expect(screen.getByRole("button", { name: "January 2027" }).getAttribute("aria-pressed")).toBe("true");
	});
});
