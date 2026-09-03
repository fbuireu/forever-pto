import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Locale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const PICKED = { from: new Date(2026, 5, 1), to: new Date(2026, 5, 7) };

vi.mock("@ui/modules/pages/planner/calendar/Calendar", () => ({
	Calendar: ({ onSelect, selected }: { onSelect: (range: unknown) => void; selected?: unknown }) => (
		<button type="button" data-selected={JSON.stringify(selected ?? null)} onClick={() => onSelect(PICKED)}>
			pick
		</button>
	),
	CalendarSelectionMode: { RANGE: "range" },
}));

const { WorkdayCounterCalendarModal } = await import("./WorkdayCounterCalendarModal");

const setOpen = vi.fn();
const handleRangeSelect = vi.fn();

interface RenderModalParams {
	open?: boolean;
	selectedRange?: { from: Date; to: Date };
}

const renderModal = ({ open = false, selectedRange }: RenderModalParams = {}) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<WorkdayCounterCalendarModal
				open={open}
				setOpen={setOpen}
				selectedRange={selectedRange}
				handleRangeSelect={handleRangeSelect}
				locale={"en" as Locale}
				holidays={[]}
			/>
		</NextIntlClientProvider>,
	);

const trigger = () => screen.getByRole("button", { name: /Select dates|Jun/ });

beforeEach(() => {
	setOpen.mockClear();
	handleRangeSelect.mockClear();
});

describe("WorkdayCounterCalendarModal", () => {
	it("invites a selection while nothing has been picked", () => {
		renderModal();

		expect(trigger().textContent).toContain(en.workdayCounterModal.selectDateRange);
	});

	it("shows the picked range on the trigger in short form", () => {
		renderModal({ selectedRange: PICKED });

		expect(trigger().textContent).toContain("Jun 1 - Jun 7");
	});

	it("keeps the calendar out of the tree until it is open", () => {
		renderModal();

		expect(screen.queryByRole("button", { name: "pick" })).toBeNull();
	});

	it("asks its owner to open rather than opening itself, since the owner holds the state", async () => {
		renderModal();

		await userEvent.click(trigger());

		expect(setOpen.mock.calls[0]?.[0]).toBe(true);
	});

	it("titles the dialog with the same invitation as the trigger", () => {
		renderModal({ open: true });

		expect(screen.getByRole("dialog", { name: en.workdayCounterModal.selectDateRange })).toBeTruthy();
	});

	it("hands the calendar the range already picked, so it opens on it", () => {
		renderModal({ open: true, selectedRange: PICKED });

		expect(screen.getByRole("button", { name: "pick" }).dataset.selected).toBe(JSON.stringify(PICKED));
	});

	it("passes the calendar's selection straight up to its owner", async () => {
		renderModal({ open: true });

		await userEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(handleRangeSelect).toHaveBeenCalledExactlyOnceWith(PICKED);
	});

	it("names the close control from the a11y bundle and closes through its owner", async () => {
		renderModal({ open: true });

		await userEvent.click(screen.getByRole("button", { name: en.a11y.closeDialog }));

		expect(setOpen.mock.calls[0]?.[0]).toBe(false);
	});
});
