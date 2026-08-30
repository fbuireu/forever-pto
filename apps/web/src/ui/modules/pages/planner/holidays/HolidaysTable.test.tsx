import { HolidayVariant } from "@application/dto/holiday/types";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { holidaysState, openHandler } = vi.hoisted(() => ({
	holidaysState: { holidays: [] as unknown[] },
	openHandler: { current: (_open: boolean) => {} },
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: typeof holidaysState) => unknown) => selector(holidaysState),
}));
vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: { premiumKey: string }) => unknown) => selector({ premiumKey: "unlocked" }),
	PremiumFeatureId: { SELECT_HOLIDAY: "selectHoliday", SELECT_ALL_HOLIDAYS: "selectAllHolidays" },
}));
vi.mock("@ui/hooks/useDebounce", () => ({ useDebounce: ({ value }: { value: string }) => [value] }));
vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => children,
	PremiumFeatureVariant: { STACK: "stack" },
}));
vi.mock("@ui/modules/core/animate/base/Checkbox", () => ({
	Checkbox: ({
		checked,
		onCheckedChange,
		...rest
	}: {
		checked?: boolean;
		onCheckedChange?: (next: boolean) => void;
		"aria-label"?: string;
	}) => (
		<input
			type="checkbox"
			checked={Boolean(checked)}
			aria-label={rest["aria-label"]}
			onChange={() => onCheckedChange?.(!checked)}
		/>
	),
}));
vi.mock("@ui/modules/core/animate/base/Collapsible", () => ({
	Collapsible: ({ children, onOpenChange }: { children: ReactNode; onOpenChange: (open: boolean) => void }) => {
		openHandler.current = onOpenChange;
		return <div>{children}</div>;
	},
	CollapsibleTrigger: ({ children }: { children: ReactNode }) => (
		<button type="button" data-testid="trigger" onClick={() => openHandler.current(true)}>
			{children}
		</button>
	),
	CollapsibleContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => children,
	IconWrapper: () => null,
}));
vi.mock("next/dynamic", () => ({
	default: () => (props: { open?: boolean; holiday?: { name: string }; holidays?: { name: string }[] }) => {
		if (props.holidays) {
			return <div data-testid="delete-modal" data-names={props.holidays.map((h) => h.name).join(",")} />;
		}
		if (props.holiday) return <div data-testid="edit-modal" data-name={props.holiday.name} />;
		return null;
	},
}));

const { HolidaysTable } = await import("./HolidaysTable");

interface HolidayParams {
	id: string;
	name: string;
	date: Date;
}

const holiday = ({ id, name, date }: HolidayParams) => ({
	id,
	name,
	date,
	variant: HolidayVariant.NATIONAL,
	isInPlanningWindow: true,
});

const renderTable = () => {
	const view = render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<HolidaysTable title="National holidays" variant={HolidayVariant.NATIONAL} open />
		</NextIntlClientProvider>,
	);
	fireEvent.click(view.getByTestId("trigger"));
	return view;
};

type View = ReturnType<typeof renderTable>;

const desktopRow = (view: View, name: string) => view.getAllByLabelText(`Select ${name}`)[0] as HTMLInputElement;
const mobileCard = (view: View, name: string) => view.getAllByLabelText(`Select ${name}`)[1] as HTMLInputElement;

beforeEach(() => {
	holidaysState.holidays = [
		holiday({ id: "national-2026-01-01", name: "Alpha", date: new Date(2026, 0, 1) }),
		holiday({ id: "national-2026-06-01", name: "Beta", date: new Date(2026, 5, 1) }),
		holiday({ id: "national-2026-12-01", name: "Gamma", date: new Date(2026, 11, 1) }),
	];
});

describe("HolidaysTable selection survives the rows moving", () => {
	it("keeps a Holiday selected when a search reorders it under a different row index", () => {
		const view = renderTable();
		fireEvent.click(desktopRow(view, "Gamma"));
		expect(desktopRow(view, "Gamma").checked).toBe(true);

		fireEvent.change(view.getByPlaceholderText(enMessages.holidaysTable.searchPlaceholder), {
			target: { value: "Gamma" },
		});

		expect(desktopRow(view, "Gamma").checked).toBe(true);
		expect(view.getByTestId("delete-modal").getAttribute("data-names")).toBe("Gamma");
		expect(view.getByTestId("edit-modal").getAttribute("data-name")).toBe("Gamma");
	});

	it("keeps a Holiday selected when sorting by name reorders it", () => {
		const view = renderTable();
		fireEvent.click(desktopRow(view, "Alpha"));

		const sortByName = view.getByRole("button", { name: enMessages.holidayTableHeader.holiday });
		fireEvent.click(sortByName);
		fireEvent.click(sortByName);

		expect(
			view.getByRole("columnheader", { name: enMessages.holidayTableHeader.holiday }).getAttribute("aria-sort"),
		).toBe("descending");
		expect(desktopRow(view, "Alpha").checked).toBe(true);
		expect(view.getByTestId("delete-modal").getAttribute("data-names")).toBe("Alpha");
	});
});

describe("HolidaysTable toolbar counts what it will act on", () => {
	it("offers to delete exactly the Holidays the modal will receive", () => {
		const view = renderTable();
		fireEvent.click(desktopRow(view, "Alpha"));
		fireEvent.click(desktopRow(view, "Beta"));

		expect(view.getByTestId("delete-modal").getAttribute("data-names")).toBe("Alpha,Beta");
		expect(view.getAllByText("Delete (2)").length).toBeGreaterThan(0);
	});

	it("drops a selected Holiday from the count once it leaves the list entirely", () => {
		const view = renderTable();
		fireEvent.click(desktopRow(view, "Gamma"));

		holidaysState.holidays = holidaysState.holidays.slice(0, 2);
		fireEvent.change(view.getByPlaceholderText(enMessages.holidaysTable.searchPlaceholder), {
			target: { value: "a" },
		});

		expect(view.queryByTestId("delete-modal")?.getAttribute("data-names")).toBe("");
		expect(view.queryByTestId("edit-modal")).toBeNull();
	});
});

describe("HolidaysTable names both of its checkboxes", () => {
	it("names the mobile card's checkbox the way the desktop row names its own", () => {
		const view = renderTable();

		expect(mobileCard(view, "Gamma").getAttribute("aria-label")).toBe("Select Gamma");
	});

	it("toggles the same Holiday from the mobile card", () => {
		const view = renderTable();

		fireEvent.click(mobileCard(view, "Beta"));

		expect(desktopRow(view, "Beta").checked).toBe(true);
	});
});

const selectAllBoxes = (view: View, label: string) => view.getAllByLabelText(label) as HTMLInputElement[];

const names = (view: View) => view.queryByTestId("delete-modal")?.getAttribute("data-names") ?? null;

const search = (view: View, term: string) =>
	fireEvent.change(view.getByPlaceholderText(enMessages.holidaysTable.searchPlaceholder), {
		target: { value: term },
	});

describe("HolidaysTable select-all", () => {
	it("offers to select everything while nothing is picked", () => {
		const view = renderTable();

		expect(selectAllBoxes(view, enMessages.holidaysTable.selectAll)[0]?.checked).toBe(false);
	});

	it("takes the whole list in one click", () => {
		const view = renderTable();

		fireEvent.click(selectAllBoxes(view, enMessages.holidaysTable.selectAll)[0]);

		expect(names(view)).toBe("Alpha,Beta,Gamma");
	});

	it("says the selection is partial while only some are picked, rather than saying nothing", () => {
		const view = renderTable();

		fireEvent.click(desktopRow(view, "Beta"));

		expect(selectAllBoxes(view, enMessages.holidaysTable.partialSelection)[0]).toBeTruthy();
	});

	it("offers to clear the selection once the whole list is picked, and clears it", () => {
		const view = renderTable();
		fireEvent.click(selectAllBoxes(view, enMessages.holidaysTable.selectAll)[0]);

		fireEvent.click(selectAllBoxes(view, enMessages.holidaysTable.deselectAll)[0]);

		expect(names(view)).toBe("");
	});

	it("takes only the rows a search left visible, which is what select-all means with a filter on", () => {
		const view = renderTable();
		search(view, "et");

		fireEvent.click(selectAllBoxes(view, enMessages.holidaysTable.selectAll)[0]);

		expect(names(view)).toBe("Beta");
	});

	it("adds the visible rows to a selection made outside the filter rather than replacing it", () => {
		const view = renderTable();
		fireEvent.click(desktopRow(view, "Gamma"));
		search(view, "Alpha");

		fireEvent.click(selectAllBoxes(view, enMessages.holidaysTable.selectAll)[0]);

		expect(names(view)).toBe("Alpha,Gamma");
	});

	it("clears only the visible rows, leaving a selection the filter hides alone", () => {
		const view = renderTable();
		fireEvent.click(selectAllBoxes(view, enMessages.holidaysTable.selectAll)[0]);
		search(view, "Alpha");

		fireEvent.click(selectAllBoxes(view, enMessages.holidaysTable.deselectAll)[0]);

		expect(names(view)).toBe("Beta,Gamma");
	});
});

describe("HolidaysTable clears the selection when a modal is done with it", () => {
	const closeModal = (view: View, testId: string) => {
		const modal = view.getByTestId(testId);
		fireEvent.click(modal);
		return modal;
	};

	it("keeps the selection while the delete modal is still open", () => {
		const view = renderTable();

		fireEvent.click(desktopRow(view, "Alpha"));

		expect(closeModal(view, "delete-modal").getAttribute("data-names")).toBe("Alpha");
	});

	it("un-picks a Holiday clicked twice, which is the other half of the toggle", () => {
		const view = renderTable();

		fireEvent.click(desktopRow(view, "Alpha"));
		fireEvent.click(desktopRow(view, "Alpha"));

		expect(names(view)).toBe("");
		expect(desktopRow(view, "Alpha").checked).toBe(false);
	});
});
