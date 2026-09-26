import { fireEvent, render, screen, within } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { MonthToggles } from "./MonthToggles";

interface RenderTogglesParams {
	locale?: Locale;
	months?: number[];
}

const renderToggles = ({ locale = "en", months = [6, 7] }: RenderTogglesParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale={locale} messages={{}}>
			<MonthToggles label="Months" months={months} onChange={onChange} />
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
});
