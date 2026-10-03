import { type HolidayOutcome, HolidayRefusal } from "@application/stores/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockToastError, mockToastSuccess, logClientError, askForPlan, PICKED } = vi.hoisted(() => ({
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
	logClientError: vi.fn(),
	askForPlan: vi.fn(),
	PICKED: new Date(2026, 4, 15),
}));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("sonner", () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

vi.mock("@application/shared/utils/clientLog", () => ({ logClientError }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({ holidays: [], currentSelection: null, alternatives: [], suggestion: null, askForPlan }),
}));

vi.mock("../../calendar/Calendar", () => ({
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

interface RenderModalParams {
	onCommit: Commit;
	withDefaults?: boolean;
	onClose?: () => void;
}

const renderModal = ({ onCommit, withDefaults = true, onClose = vi.fn() }: RenderModalParams) =>
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
		renderModal({ onCommit });

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ name: "Company shutdown" }));
		expect(mockToastSuccess).toHaveBeenCalledWith(en.modals.addHoliday.successTitle, { description: "saved" });
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it("renders the refusal the store gave, not a guess of its own", async () => {
		const onCommit = vi.fn(() => ({ applied: false as const, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY }));
		renderModal({ onCommit });

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(mockToastError).toHaveBeenCalledExactlyOnceWith(en.modals.addHoliday.existsTitle, expect.any(Object));
		expect(mockToastSuccess).not.toHaveBeenCalled();
	});

	it("falls back to its own error copy for a refusal with no message of its own", async () => {
		const onCommit = vi.fn(() => ({ applied: false as const, reason: "unmapped" as never }));
		renderModal({ onCommit });

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(mockToastError).toHaveBeenCalledWith(en.modals.addHoliday.errorTitle, {
			description: en.modals.addHoliday.errorDescription,
		});
	});

	it("stays silent when the caller answers null, which is how Edit says nothing changed", async () => {
		const onCommit = vi.fn(() => null);
		renderModal({ onCommit });

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.submit }));

		expect(onCommit).toHaveBeenCalledOnce();
		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(mockToastError).not.toHaveBeenCalled();
	});
});

describe("HolidayFormModal date picking", () => {
	it("shows the date picked on the calendar and hands it to the commit", async () => {
		const onCommit = vi.fn(() => ({ applied: true as const }));
		renderModal({ onCommit, withDefaults: false });
		await userEvent.type(screen.getByLabelText(en.modals.addHoliday.nameLabel), "Offsite");

		await userEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(screen.getByText(`${en.modals.addHoliday.selected}: Friday, May 15, 2026`)).toBeTruthy();

		await submit();

		expect(onCommit).toHaveBeenCalledExactlyOnceWith({ name: "Offsite", date: PICKED });
	});

	it("ignores a calendar answer that is not a single date, since only the single mode reaches it", async () => {
		renderModal({ onCommit: vi.fn(() => null), withDefaults: false });

		await userEvent.click(screen.getByRole("button", { name: "pick many" }));

		expect(screen.queryByText(new RegExp(`^${en.modals.addHoliday.selected}:`))).toBeNull();
	});

	it("shows the date it was opened with as already selected", () => {
		renderModal({ onCommit: vi.fn(() => null) });

		expect(screen.getByText(`${en.modals.addHoliday.selected}: Friday, May 1, 2026`)).toBeTruthy();
	});
});

describe("HolidayFormModal validation", () => {
	it("refuses to submit without a name, and says so beside the field rather than in a toast", async () => {
		const onCommit = vi.fn(() => ({ applied: true as const }));
		renderModal({ onCommit });
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
		renderModal({
			onCommit: () => {
				throw new Error("store refused");
			},
			onClose,
		});

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
		renderModal({ onCommit, onClose });

		await userEvent.click(screen.getByRole("button", { name: en.modals.addHoliday.cancel }));

		expect(onClose).toHaveBeenCalledOnce();
		expect(onCommit).not.toHaveBeenCalled();
	});

	it("closes once a commit has landed, so the form does not linger over a saved Holiday", async () => {
		const onClose = vi.fn();
		renderModal({ onCommit: vi.fn(() => ({ applied: true as const })), onClose });

		await submit();

		expect(onClose).toHaveBeenCalledOnce();
	});
});

describe("HolidayFormModal analytics", () => {
	it("reports a saved Custom Holiday by mode and outcome, never by name or date", async () => {
		renderModal({ onCommit: vi.fn(() => ({ applied: true as const })) });

		await submit();

		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "custom_holiday_saved",
			properties: { mode: "add", applied: true },
		});
		expect(JSON.stringify(track.mock.calls)).not.toContain("Company shutdown");
		expect(JSON.stringify(track.mock.calls)).not.toContain("2026");
	});

	it("reports a refusal with the store's reason", async () => {
		renderModal({ onCommit: vi.fn(() => ({ applied: false as const, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY })) });

		await submit();

		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "custom_holiday_saved",
			properties: { mode: "add", applied: false, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY },
		});
	});

	it("asks for a plan when the Custom Holiday lands, and not for a refusal or for no change", async () => {
		const applied = renderModal({ onCommit: vi.fn(() => ({ applied: true as const })) });
		await submit();
		expect(askForPlan).toHaveBeenCalledOnce();
		applied.unmount();

		const refused = renderModal({
			onCommit: vi.fn(() => ({ applied: false as const, reason: HolidayRefusal.DATE_HELD_BY_HOLIDAY })),
		});
		await submit();
		refused.unmount();

		renderModal({ onCommit: vi.fn(() => null) });
		await submit();

		expect(askForPlan).toHaveBeenCalledOnce();
	});
});

describe("HolidayFormModal labels", () => {
	const LABELABLE = new Set(["BUTTON", "INPUT", "METER", "OUTPUT", "PROGRESS", "SELECT", "TEXTAREA"]);

	it("points every label at an element a label can name, heading the date picker instead", () => {
		renderModal({ onCommit: vi.fn(() => ({ applied: true as const })) });
		const labels = [...document.querySelectorAll("label[for]")];
		const pointingAtNothingNameable = labels.filter(
			(label) => !LABELABLE.has(document.getElementById(label.getAttribute("for") ?? "")?.tagName ?? ""),
		);

		expect(labels.length).toBeGreaterThan(0);
		expect(pointingAtNothingNameable).toEqual([]);
		expect(screen.getByText(en.modals.addHoliday.dateLabel).tagName).not.toBe("LABEL");
	});
});
