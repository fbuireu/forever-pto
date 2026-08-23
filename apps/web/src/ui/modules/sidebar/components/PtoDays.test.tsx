import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

vi.mock("@application/stores/filters", () => ({
	MIN_PTO_DAYS: 1,
	MAX_PTO_DAYS: 60,
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ ptoDays: 23, setPtoDays: vi.fn() }),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({ resetManualSelection: vi.fn(), trimManualDays: vi.fn() }),
}));

vi.mock("@ui/hooks/usePlanReadout", () => ({
	usePlanReadout: () => ({ suggested: 4, manual: 2, remaining: 17, hasManualChanges: false }),
}));

const { PtoDays } = await import("./PtoDays");

const renderField = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<PtoDays />
		</NextIntlClientProvider>,
	);

describe("PtoDays", () => {
	it("names the two budget controls, which are the only things this field can operate", () => {
		renderField();

		expect(screen.getByRole("button", { name: en.ptoDays.decrease })).toBeTruthy();
		expect(screen.getByRole("button", { name: en.ptoDays.increase })).toBeTruthy();
	});

	it("renders no label element, because the counter it heads is a div", () => {
		const { container } = renderField();

		expect(container.querySelectorAll("label")).toHaveLength(0);
	});
});
