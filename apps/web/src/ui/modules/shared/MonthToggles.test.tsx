import { fireEvent, render, screen, within } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { MonthToggles } from "./MonthToggles";

interface RenderTogglesParams {
	locale?: Locale;
	months?: number[];
	reachable?: ReadonlySet<number>;
}

const EVERY_MONTH: ReadonlySet<number> = new Set(Array.from({ length: 12 }, (_, month) => month));

const renderToggles = ({ locale = "en", months = [6, 7], reachable = EVERY_MONTH }: RenderTogglesParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale={locale} messages={{}}>
			<MonthToggles label="Months" months={months} onChange={onChange} reachable={reachable} />
		</NextIntlClientProvider>,
	);

	return onChange;
};

describe("MonthToggles", () => {
	it("offers the twelve months inside a group named by its legend, the chosen ones pressed", () => {
		renderToggles();

		const group = screen.getByRole("group", { name: "Months" });
		expect(within(group).getAllByRole("button")).toHaveLength(12);
		expect(screen.getByRole("button", { name: "July" }).getAttribute("aria-pressed")).toBe("true");
		expect(screen.getByRole("button", { name: "January" }).getAttribute("aria-pressed")).toBe("false");
	});

	it("names each month in the reader's locale", () => {
		renderToggles({ locale: "es" });

		expect(screen.getByRole("button", { name: "julio" })).toBeDefined();
	});

	it("hands back the months with one added", () => {
		const onChange = renderToggles();

		fireEvent.click(screen.getByRole("button", { name: "March" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([6, 7, 2]);
	});

	it("hands back the months with one removed", () => {
		const onChange = renderToggles();

		fireEvent.click(screen.getByRole("button", { name: "July" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([7]);
	});

	it("refuses a month the plan can no longer reach, and does not show it as chosen", () => {
		const onChange = renderToggles({ months: [2, 7], reachable: new Set([8, 9, 10, 11]) });

		const march = screen.getByRole("button", { name: "March" });
		expect(march).toHaveProperty("disabled", true);
		expect(march.getAttribute("aria-pressed")).toBe("false");
		expect(screen.getByRole("button", { name: "August" }).getAttribute("aria-pressed")).toBe("false");

		fireEvent.click(march);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("keeps an unreachable choice when another month is toggled, so it returns once past days are allowed", () => {
		const onChange = renderToggles({ months: [2], reachable: new Set([8, 9, 10, 11]) });

		fireEvent.click(screen.getByRole("button", { name: "October" }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith([2, 9]);
	});
});
