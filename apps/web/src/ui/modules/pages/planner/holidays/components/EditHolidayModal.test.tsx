import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockToastError, mockToastSuccess, editHoliday } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	editHoliday: vi.fn(() => ({ applied: true as const })),
}));

const MOVED_TO = new Date(2026, 4, 8);

vi.mock("sonner", () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));
vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({ holidays: [], currentSelection: null, editHoliday }),
}));
vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ year: 2026, carryOverMonths: 2 }),
}));
vi.mock("@ui/modules/pages/planner/calendar/Calendar", () => ({
	Calendar: ({ onSelect }: { onSelect?: (date: Date) => void }) => (
		<button type="button" onClick={() => onSelect?.(MOVED_TO)}>
			move the date
		</button>
	),
	CalendarSelectionMode: { SINGLE: "single" },
}));

const { EditHolidayModal } = await import("./EditHolidayModal");

const SHUTDOWN: HolidayDTO = {
	id: "custom-1",
	date: new Date(2026, 4, 1),
	name: "Company shutdown",
	variant: HolidayVariant.CUSTOM,
	isInPlanningWindow: true,
};

const renderModal = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<EditHolidayModal open onClose={vi.fn()} locale="en" holiday={SHUTDOWN} />
		</NextIntlClientProvider>,
	);

const save = () => userEvent.click(screen.getByRole("button", { name: en.modals.editHoliday.submit }));

const rename = async (name: string) => {
	const field = screen.getByLabelText(en.modals.addHoliday.nameLabel);
	await userEvent.clear(field);
	await userEvent.type(field, name);
};

beforeEach(() => vi.clearAllMocks());

describe("EditHolidayModal", () => {
	it("starts from the Holiday it was handed, so saving untouched is a no-op with no toast", async () => {
		renderModal();

		expect(screen.getByDisplayValue(SHUTDOWN.name)).toBeTruthy();

		await save();

		expect(editHoliday).not.toHaveBeenCalled();
		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it("sends the store the Holiday's id, the new name and the window the change is checked against", async () => {
		renderModal();
		await rename("Summer closure");

		await save();

		expect(editHoliday).toHaveBeenCalledExactlyOnceWith({
			holidayId: SHUTDOWN.id,
			updates: { name: "Summer closure", date: SHUTDOWN.date },
			year: 2026,
			carryOverMonths: 2,
		});
		expect(mockToastSuccess).toHaveBeenCalledWith(en.modals.editHoliday.successTitle, {
			description: "Summer closure has been updated",
		});
	});

	it("counts a moved date as a change even when the name is untouched", async () => {
		renderModal();
		await userEvent.click(screen.getByRole("button", { name: "move the date" }));

		await save();

		expect(editHoliday).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ updates: { name: SHUTDOWN.name, date: MOVED_TO } }),
		);
	});

	it("reads its title and footer from the edit namespace, and only the field chrome from the add one", () => {
		renderModal();

		expect(screen.getByRole("heading", { name: en.modals.editHoliday.title })).toBeTruthy();
		expect(screen.getByRole("button", { name: en.modals.editHoliday.submit })).toBeTruthy();
		expect(screen.queryByRole("button", { name: en.modals.addHoliday.submit })).toBeNull();
	});
});
