import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({ ptoDays: 23, setPtoDays: vi.fn() }));

const holidays = vi.hoisted(() => ({ resetManualSelection: vi.fn(), trimManualDays: vi.fn() }));

const readout = vi.hoisted(() => ({ suggested: 4, manual: 2, remaining: 17, hasManualChanges: false }));

vi.mock("@application/stores/filters", () => ({
	MIN_PTO_DAYS: 1,
	MAX_PTO_DAYS: 60,
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(filters),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector(holidays),
}));

vi.mock("@ui/hooks/usePlanReadout", () => ({
	usePlanReadout: () => readout,
}));

const { PtoDays } = await import("./PtoDays");

const renderField = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<PtoDays />
		</NextIntlClientProvider>,
	);

const decrease = () => screen.getByRole("button", { name: en.ptoDays.decrease });

const increase = () => screen.getByRole("button", { name: en.ptoDays.increase });

beforeEach(() => {
	filters.ptoDays = 23;
	filters.setPtoDays.mockClear();
	holidays.resetManualSelection.mockClear();
	holidays.trimManualDays.mockClear();
	readout.suggested = 4;
	readout.manual = 2;
	readout.remaining = 17;
	readout.hasManualChanges = false;
});

describe("PtoDays", () => {
	it("names the two budget controls, which are the only things this field can operate", () => {
		renderField();

		expect(decrease()).toBeTruthy();
		expect(increase()).toBeTruthy();
	});

	it("renders no label element, because the counter it heads is a div", () => {
		const { container } = renderField();

		expect(container.querySelectorAll("label")).toHaveLength(0);
	});

	it("stores one more day and trims the manual picks to the new budget in the same step", async () => {
		renderField();

		await userEvent.click(increase());

		expect(filters.setPtoDays).toHaveBeenCalledExactlyOnceWith(24);
		expect(holidays.trimManualDays).toHaveBeenCalledExactlyOnceWith(24);
	});

	it("stores one fewer day the same way", async () => {
		renderField();

		await userEvent.click(decrease());

		expect(filters.setPtoDays).toHaveBeenCalledExactlyOnceWith(22);
		expect(holidays.trimManualDays).toHaveBeenCalledExactlyOnceWith(22);
	});

	it("refuses to go below the minimum budget", () => {
		filters.ptoDays = 1;

		renderField();

		expect(decrease()).toHaveProperty("disabled", true);
		expect(increase()).toHaveProperty("disabled", false);
	});

	it("refuses to go above the maximum budget", () => {
		filters.ptoDays = 60;

		renderField();

		expect(increase()).toHaveProperty("disabled", true);
		expect(decrease()).toHaveProperty("disabled", false);
	});

	it("reports the three counts by name, since the digits themselves are hidden from assistive tech", () => {
		renderField();

		expect(screen.getByRole("img", { name: `${en.ptoDays.autoAssigned}: 4` })).toBeTruthy();
		expect(screen.getByRole("img", { name: `${en.ptoDays.manuallySelected}: 2` })).toBeTruthy();
		expect(screen.getByRole("img", { name: `${en.ptoDays.remaining}: 17` })).toBeTruthy();
	});

	it("invites manual picks while days remain", () => {
		renderField();

		expect(screen.getByText(en.ptoDays.clickToAssign)).toBeTruthy();
		expect(screen.queryByText(en.ptoDays.allAssigned)).toBeNull();
	});

	it("says every day is assigned once none remain and nothing was changed by hand", () => {
		readout.remaining = 0;

		renderField();

		expect(screen.getByText(en.ptoDays.allAssigned)).toBeTruthy();
		expect(screen.queryByText(en.ptoDays.clickToAssign)).toBeNull();
	});

	it("offers a reset only once there are manual changes to undo", () => {
		renderField();

		expect(screen.queryByRole("button", { name: en.ptoDays.resetManualChanges })).toBeNull();
	});

	it("resets the manual selection through the store when asked", async () => {
		readout.hasManualChanges = true;
		readout.remaining = 0;

		renderField();
		await userEvent.click(screen.getByRole("button", { name: en.ptoDays.resetManualChanges }));

		expect(holidays.resetManualSelection).toHaveBeenCalledOnce();
		expect(screen.queryByText(en.ptoDays.allAssigned)).toBeNull();
	});
});
