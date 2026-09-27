import en from "@i18n/messages/en.json";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonthToggles } from "./MonthToggles";

const YEAR = 2026;

interface RenderTogglesParams {
	locale?: Locale;
	months?: number[];
	allowPastDays?: boolean;
	carryOverMonths?: number;
}

const renderToggles = ({
	locale = "en",
	months = [6, 7],
	allowPastDays = true,
	carryOverMonths = 0,
}: RenderTogglesParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale={locale} messages={en}>
			<MonthToggles
				label="Months"
				planningWindow={{ year: YEAR, carryOverMonths }}
				allowPastDays={allowPastDays}
				months={months}
				onChange={onChange}
			/>
		</NextIntlClientProvider>,
	);

	return onChange;
};

beforeEach(() => {
	vi.useFakeTimers({ now: new Date(YEAR, 8, 26), toFake: ["Date"] });
});

afterEach(() => {
	vi.useRealTimers();
});

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

	it("hands back the months with one added, in calendar order", () => {
		const onChange = renderToggles();

		fireEvent.click(screen.getByRole("button", { name: "March 2026" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([2, 6, 7]);
	});

	it("hands back the months with one removed", () => {
		const onChange = renderToggles();

		fireEvent.click(screen.getByRole("button", { name: "July 2026" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([7]);
	});

	describe("with past days not allowed", () => {
		it("refuses a month already past, and does not show it as chosen", () => {
			const onChange = renderToggles({ months: [2, 7], allowPastDays: false });

			const march = screen.getByRole("button", { name: "March 2026" });
			expect(march).toHaveProperty("disabled", true);
			expect(march.getAttribute("aria-pressed")).toBe("false");
			expect(screen.getByRole("button", { name: "September 2026" })).toHaveProperty("disabled", false);

			fireEvent.click(march);
			expect(onChange).not.toHaveBeenCalled();
		});

		it("says any month will do when every choice has passed", () => {
			renderToggles({ months: [2, 7], allowPastDays: false });

			expect(screen.getByText(en.sidebar.preferredMonths.anyMonth)).toBeDefined();
		});

		it("keeps a passed choice when another month is toggled, so it returns once past days are allowed", () => {
			const onChange = renderToggles({ months: [2], allowPastDays: false });

			fireEvent.click(screen.getByRole("button", { name: "October 2026" }));

			expect(onChange).toHaveBeenCalledExactlyOnceWith([2, 9]);
		});
	});

	it("says nothing about any month while a choice still counts", () => {
		renderToggles();

		expect(screen.queryByText(en.sidebar.preferredMonths.anyMonth)).toBeNull();
	});

	it("adds the Carry-over Months after December, under the next year", () => {
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
