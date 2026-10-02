import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({ ptoDays: 23, setPtoDays: vi.fn() }));

const holidays = vi.hoisted(() => ({ resetManualSelection: vi.fn(), trimManualDays: vi.fn(), askForPlan: vi.fn() }));

const readout = vi.hoisted(() => ({ suggested: 4, manual: 2, remaining: 17, hasManualChanges: false }));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

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
	holidays.askForPlan.mockClear();
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

	it("hands the counter the unit in the bundle's own case, leaving the upper case to its class", () => {
		renderField();

		expect(screen.getByText(en.ptoDays.days).className.split(" ")).toContain("uppercase");
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

	it("reads each count once, as text after its own label, since the rolling digits are hidden from assistive tech", () => {
		renderField();

		for (const [label, count] of [
			[en.ptoDays.autoAssigned, "4"],
			[en.ptoDays.manuallySelected, "2"],
			[en.ptoDays.remaining, "17"],
		]) {
			const row = screen.getByText(label).parentElement as HTMLElement;
			const read = [...row.querySelectorAll("*")]
				.filter((node) => node.children.length === 0 && !node.closest('[aria-hidden="true"]'))
				.map((node) => node.textContent);

			expect(read).toEqual([label, count]);
			expect(row.querySelector("[role], [aria-label]")).toBeNull();
		}
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

describe("PtoDays analytics", () => {
	it("asks for a plan on every change of the budget and on a reset, the plans a person asks for", async () => {
		readout.hasManualChanges = true;
		renderField();

		await userEvent.click(increase());
		await userEvent.click(decrease());
		await userEvent.click(screen.getByRole("button", { name: en.ptoDays.resetManualChanges }));

		expect(holidays.askForPlan).toHaveBeenCalledTimes(3);
	});

	it("asks for no plan when the counter cannot move", async () => {
		filters.ptoDays = 1;
		renderField();

		await userEvent.click(decrease());

		expect(holidays.askForPlan).not.toHaveBeenCalled();
	});

	it("reports the new budget on every change", async () => {
		track.mockClear();
		renderField();

		await userEvent.click(increase());
		await userEvent.click(decrease());

		expect(track.mock.calls.map(([call]) => call)).toStrictEqual([
			{ event: "planning_input_changed", properties: { input: "ptoDays", inputValue: 24 } },
			{ event: "planning_input_changed", properties: { input: "ptoDays", inputValue: 22 } },
		]);
	});

	it("reports a reset of the manual changes from the sidebar", async () => {
		track.mockClear();
		readout.hasManualChanges = true;
		renderField();

		await userEvent.click(screen.getByRole("button", { name: en.ptoDays.resetManualChanges }));

		expect(holidays.resetManualSelection).toHaveBeenCalledOnce();
		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "manual_changes_reset",
			properties: { surface: "sidebar" },
		});
	});
});
