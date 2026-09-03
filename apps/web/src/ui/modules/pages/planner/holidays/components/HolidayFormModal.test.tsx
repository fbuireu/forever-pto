import { type HolidayOutcome, HolidayRefusal } from "@application/stores/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockToastError, mockToastSuccess, logClientError, PICKED } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	logClientError: vi.fn(),
	PICKED: new Date(2026, 4, 15),
}));

vi.mock("sonner", () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({ holidays: [], currentSelection: null, alternatives: [], suggestion: null }),
}));

vi.mock("@ui/modules/pages/planner/calendar/Calendar", () => ({
	Calendar: ({ onSelect }: { onSelect?: (date: Date | Date[]) => void }) => (
		<>
			<button type="button" onClick={() => onSelect?.(PICKED)}>
				pick
			</button>
			<button type="button" onClick={() => onSelect?.([PICKED])}>
				pick many
			</button>
		</>
	),
	CalendarSelectionMode: { SINGLE: "single" },
}));

const { HolidayFormModal, HolidayFormMode } = await import("./HolidayFormModal");

const DATE = new Date(2026, 4, 1);

type Commit = (data: { name: string; date: Date }) => HolidayOutcome | null;

interface RenderModalOptions {
	withDefaults?: boolean;
	onClose?: () => void;
}

const renderModal = (onCommit: Commit, { withDefaults = true, onClose = vi.fn() }: RenderModalOptions = {}) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<HolidayFormModal
				open
				onClose={onClose}
				locale="en"
				mode={HolidayFormMode.ADD}
				icon={null}
				defaultValues={withDefaults ? { name: "Company shutdown", date: DATE } : undefined}
				onCommit={onCommit}
				successDescription={() => "saved"}
			/>
		</NextIntlClientProvider>,
	);

const submit = () => userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

beforeEach(() => vi.clearAllMocks());

describe("HolidayFormModal", () => {
	it("reports the store outcome as a success toast when the commit lands", async () => {
		const onCommit = vi.fn(() => ({ applied: true as const }));
		renderModal(onCommit);

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ name: "Company shutdown" }));
		expect(mockToastSuccess).toHaveBeenCalledWith(en.modals.addHoliday.successTitle, { description: "saved" });
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it("renders the refusal the store gave, not a guess of its own", async () => {
		const onCommit = vi.fn(() => ({ applied: false as const, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY }));
		renderModal(onCommit);

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(mockToastError).toHaveBeenCalledOnce();
		expect(mockToastSuccess).not.toHaveBeenCalled();
	});

	it("falls back to its own error copy for a refusal with no message of its own", async () => {
		const onCommit = vi.fn(() => ({ applied: false as const, reason: "unmapped" as never }));
		renderModal(onCommit);

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(mockToastError).toHaveBeenCalledWith(en.modals.addHoliday.errorTitle, {
			description: en.modals.addHoliday.errorDescription,
		});
	});

	it("stays silent when the caller answers null, which is how Edit says nothing changed", async () => {
		const onCommit = vi.fn(() => null);
		renderModal(onCommit);

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(onCommit).toHaveBeenCalledOnce();
		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(mockToastError).not.toHaveBeenCalled();
	});
});

describe("HolidayFormModal date picking", () => {
	it("shows the date picked on the calendar and hands it to the commit", async () => {
		const onCommit = vi.fn(() => ({ applied: true as const }));
		renderModal(onCommit, { withDefaults: false });
		await userEvent.type(screen.getByLabelText(en.modals.addHoliday.nameLabel), "Offsite");

		await userEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(screen.getByText(`${en.modals.addHoliday.selected}: Friday, May 15, 2026`)).toBeTruthy();

		await submit();

		expect(onCommit).toHaveBeenCalledExactlyOnceWith({ name: "Offsite", date: PICKED });
	});

	it("ignores a calendar answer that is not a single date, since only the single mode reaches it", async () => {
		renderModal(
			vi.fn(() => null),
			{ withDefaults: false },
		);

		await userEvent.click(screen.getByRole("button", { name: "pick many" }));

		expect(screen.queryByText(new RegExp(`^${en.modals.addHoliday.selected}:`))).toBeNull();
	});

	it("shows the date it was opened with as already selected", () => {
		renderModal(vi.fn(() => null));

		expect(screen.getByText(`${en.modals.addHoliday.selected}: Friday, May 1, 2026`)).toBeTruthy();
	});
});

describe("HolidayFormModal validation", () => {
	it("refuses to submit without a name, and says so beside the field rather than in a toast", async () => {
		const onCommit = vi.fn(() => ({ applied: true as const }));
		renderModal(onCommit);
		await userEvent.clear(screen.getByLabelText(en.modals.addHoliday.nameLabel));

		await submit();

		expect(await screen.findByText(en.validation.holiday.nameRequired)).toBeTruthy();
		expect(onCommit).not.toHaveBeenCalled();
		expect(mockToastError).not.toHaveBeenCalled();
	});
});

describe("HolidayFormModal when the commit throws", () => {
	it("reports its own error copy and leaves a record, and does not close on a success it never got", async () => {
		const onClose = vi.fn();
		renderModal(
			() => {
				throw new Error("store refused");
			},
			{ onClose },
		);

		await submit();

		expect(mockToastError).toHaveBeenCalledWith(en.modals.addHoliday.errorTitle, {
			description: en.modals.addHoliday.errorDescription,
		});
		expect(logClientError).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ context: { component: "HolidayFormModal", mode: HolidayFormMode.ADD } }),
		);
		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});
});

describe("HolidayFormModal closing", () => {
	it("closes without committing when cancelled", async () => {
		const onCommit = vi.fn(() => ({ applied: true as const }));
		const onClose = vi.fn();
		renderModal(onCommit, { onClose });

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.cancel }));

		expect(onClose).toHaveBeenCalledOnce();
		expect(onCommit).not.toHaveBeenCalled();
	});

	it("closes once a commit has landed, so the form does not linger over a saved Holiday", async () => {
		const onClose = vi.fn();
		renderModal(
			vi.fn(() => ({ applied: true as const })),
			{ onClose },
		);

		await submit();

		expect(onClose).toHaveBeenCalledOnce();
	});
});
