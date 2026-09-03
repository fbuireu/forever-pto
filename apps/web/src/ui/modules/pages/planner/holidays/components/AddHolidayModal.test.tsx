import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockToastError, mockToastSuccess, addHoliday } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	addHoliday: vi.fn(() => ({ applied: true as const })),
}));

const PICKED = new Date(2026, 4, 1);

vi.mock("sonner", () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));
vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({ holidays: [], currentSelection: null, addHoliday }),
}));
vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ year: 2026, carryOverMonths: 3 }),
}));
vi.mock("@ui/modules/pages/planner/calendar/Calendar", () => ({
	Calendar: ({ onSelect }: { onSelect?: (date: Date) => void }) => (
		<button type="button" onClick={() => onSelect?.(PICKED)}>
			pick a date
		</button>
	),
	CalendarSelectionMode: { SINGLE: "single" },
}));

const { AddHolidayModal } = await import("./AddHolidayModal");

const renderModal = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<AddHolidayModal open onClose={vi.fn()} locale="en" />
		</NextIntlClientProvider>,
	);

const submit = () => userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

beforeEach(() => vi.clearAllMocks());

describe("AddHolidayModal", () => {
	it("hands the store the name and date it was given, with the window they are checked against", async () => {
		renderModal();
		await userEvent.type(screen.getByLabelText(en.modals.addHoliday.nameLabel), "Company shutdown");
		await userEvent.click(screen.getByRole("button", { name: "pick a date" }));

		await submit();

		expect(addHoliday).toHaveBeenCalledExactlyOnceWith({
			holiday: { name: "Company shutdown", date: PICKED },
			carryOverMonths: 3,
			year: 2026,
		});
		expect(mockToastSuccess).toHaveBeenCalledWith(en.modals.addHoliday.successTitle, {
			description: "Company shutdown has been added on May 1, 2026",
		});
	});

	it("refuses to submit before a date has been picked, and says which field is missing", async () => {
		renderModal();
		await userEvent.type(screen.getByLabelText(en.modals.addHoliday.nameLabel), "Company shutdown");

		await submit();

		expect(await screen.findByText(en.validation.holiday.invalidDate)).toBeTruthy();
		expect(addHoliday).not.toHaveBeenCalled();
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it("starts empty, with no date shown as selected", () => {
		renderModal();

		expect((screen.getByLabelText(en.modals.addHoliday.nameLabel) as HTMLInputElement).value).toBe("");
		expect(screen.queryByText(new RegExp(`^${en.modals.addHoliday.selected}:`))).toBeNull();
	});

	it("reads its copy from the add namespace", () => {
		renderModal();

		expect(screen.getByRole("heading", { name: en.modals.addHoliday.title })).toBeTruthy();
		expect(screen.getByText(en.modals.addHoliday.description)).toBeTruthy();
	});
});
