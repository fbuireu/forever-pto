import { HolidayVariant } from "@application/dto/holiday/types";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { holidaysState, openHandler, loaders } = vi.hoisted(() => ({
	holidaysState: { holidays: [] as unknown[] },
	openHandler: { current: (_open: boolean) => {} },
	loaders: [] as (() => Promise<{ default: unknown }>)[],
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
interface ModalMockProps {
	open?: boolean;
	onClose?: () => void;
	holiday?: { name: string };
	holidays?: { name: string }[];
}

vi.mock("next/dynamic", () => ({
	default: (loader: () => Promise<{ default: unknown }>) => {
		loaders.push(loader);
		return (props: ModalMockProps) => {
			if (props.holidays) {
				return (
					<div
						data-testid="delete-modal"
						data-names={props.holidays.map((h) => h.name).join(",")}
						data-open={String(props.open)}
					>
						<button type="button" onClick={props.onClose}>
							close delete
						</button>
					</div>
				);
			}
			if (props.holiday) {
				return (
					<div data-testid="edit-modal" data-name={props.holiday.name} data-open={String(props.open)}>
						<button type="button" onClick={props.onClose}>
							close edit
						</button>
					</div>
				);
			}
			return (
				<div data-testid="add-modal" data-open={String(props.open)}>
					<button type="button" onClick={props.onClose}>
						close add
					</button>
				</div>
			);
		};
	},
}));

const { HolidaysTable } = await import("./HolidaysTable");

interface HolidayParams {
	id: string;
	name: string;
	date: Date;
	type?: string;
	location?: string;
}

const holiday = ({ id, name, date, type, location }: HolidayParams) => ({
	id,
	name,
	date,
	type,
	location,
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

const renderCustomTable = () => {
	holidaysState.holidays = [
		{ ...holiday({ id: "custom-1", name: "Shutdown", date: new Date(2026, 0, 2) }), variant: HolidayVariant.CUSTOM },
	];
	const view = render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<HolidaysTable title="Custom holidays" variant={HolidayVariant.CUSTOM} open />
		</NextIntlClientProvider>,
	);
	fireEvent.click(view.getByTestId("trigger"));
	return view;
};

const press = (view: View, name: RegExp) => fireEvent.click(view.getByRole("button", { name }));

const ADD = new RegExp(enMessages.holidaysTable.addHoliday);
const EDIT = new RegExp(enMessages.holidaysTable.editHoliday);
const DELETE_TWO = /Delete \(2\)/;

describe("HolidaysTable toolbar", () => {
	it("offers to add one on the tab that owns Custom Holidays", () => {
		expect(renderCustomTable().getByRole("button", { name: ADD })).toBeTruthy();
	});

	it("offers no add button on a tab whose Holidays come from the country", () => {
		expect(renderTable().queryByRole("button", { name: ADD })).toBeNull();
	});

	it("offers to edit exactly one Holiday, never a pair", () => {
		const view = renderTable();
		expect(view.queryByRole("button", { name: EDIT })).toBeNull();

		fireEvent.click(desktopRow(view, "Alpha"));
		expect(view.getByRole("button", { name: EDIT })).toBeTruthy();

		fireEvent.click(desktopRow(view, "Beta"));
		expect(view.queryByRole("button", { name: EDIT })).toBeNull();
	});
});

describe("HolidaysTable modals", () => {
	it("opens the add form and clears the selection when it closes", () => {
		const view = renderCustomTable();
		fireEvent.click(desktopRow(view, "Shutdown"));

		press(view, ADD);
		expect(view.getByTestId("add-modal").dataset.open).toBe("true");

		fireEvent.click(view.getByRole("button", { name: "close add" }));

		expect(view.getByTestId("add-modal").dataset.open).toBe("false");
		expect(names(view)).toBe("");
	});

	it("opens the edit form on the Holiday that is selected, and clears it on close", () => {
		const view = renderTable();
		fireEvent.click(desktopRow(view, "Beta"));

		press(view, EDIT);
		expect(view.getByTestId("edit-modal").dataset.name).toBe("Beta");

		fireEvent.click(view.getByRole("button", { name: "close edit" }));

		expect(names(view)).toBe("");
	});

	it("clears the selection when the delete form closes, so the count cannot outlive it", () => {
		const view = renderTable();
		fireEvent.click(desktopRow(view, "Alpha"));
		fireEvent.click(desktopRow(view, "Beta"));

		press(view, DELETE_TWO);
		expect(view.getByTestId("delete-modal").dataset.open).toBe("true");

		fireEvent.click(view.getByRole("button", { name: "close delete" }));

		expect(names(view)).toBe("");
		expect(view.getByTestId("delete-modal").dataset.open).toBe("false");
	});
});

describe("HolidaysTable with nothing to show", () => {
	it("says so, and offers a select-all that selects nothing", () => {
		const view = renderTable();

		search(view, "no such holiday");

		expect(selectAllBoxes(view, enMessages.holidaysTable.selectAll)[0]?.checked).toBe(false);
		expect(view.getAllByText(enMessages.holidaysTable.noHolidaysFound).length).toBeGreaterThan(0);
	});
});

describe("HolidaysTable loads its three modals lazily", () => {
	it("resolves each one to the export it names, so a renamed export fails here rather than on first open", async () => {
		expect(loaders).toHaveLength(3);

		for (const loader of loaders) {
			await expect(loader()).resolves.toEqual({ default: expect.any(Function) });
		}
	});
});

describe("HolidaysTable follows its tab", () => {
	const wrap = (open: boolean) => (
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<HolidaysTable title="National holidays" variant={HolidayVariant.NATIONAL} open={open} />
		</NextIntlClientProvider>
	);

	it("folds itself back up when the tab it sits in closes, so it does not come back open on the next visit", () => {
		const view = render(wrap(true));
		fireEvent.click(view.getByTestId("trigger"));
		expect(view.getByPlaceholderText(enMessages.holidaysTable.searchPlaceholder)).toBeTruthy();

		view.rerender(wrap(false));

		expect(view.queryByPlaceholderText(enMessages.holidaysTable.searchPlaceholder)).toBeNull();
	});
});

const rowOrder = (view: View) =>
	view
		.getAllByLabelText(/^Select (?!all$)/)
		.slice(0, holidaysState.holidays.length)
		.map((box) => box.getAttribute("aria-label")?.replace("Select ", ""));

describe("HolidaysTable sorting", () => {
	it("orders by date both ways, which the name order cannot stand in for", () => {
		holidaysState.holidays = [
			holiday({ id: "n-3", name: "Alpha", date: new Date(2026, 5, 1) }),
			holiday({ id: "n-1", name: "Mike", date: new Date(2026, 11, 1) }),
			holiday({ id: "n-2", name: "Zulu", date: new Date(2026, 0, 1) }),
		];
		const view = renderTable();
		const sortByDate = view.getByRole("button", { name: enMessages.holidayTableHeader.date });

		fireEvent.click(sortByDate);
		expect(rowOrder(view)).toStrictEqual(["Zulu", "Alpha", "Mike"]);

		fireEvent.click(sortByDate);
		expect(rowOrder(view)).toStrictEqual(["Mike", "Alpha", "Zulu"]);
	});

	it("keeps the holidays without a type after the typed ones, whichever way the order runs", () => {
		holidaysState.holidays = [
			holiday({ id: "n-1", name: "Alpha", date: new Date(2026, 0, 1), type: "public" }),
			holiday({ id: "n-2", name: "Beta", date: new Date(2026, 5, 1) }),
			holiday({ id: "n-3", name: "Gamma", date: new Date(2026, 11, 1), type: "bank" }),
		];
		const view = renderTable();
		const sortByType = view.getByRole("button", { name: enMessages.holidayTableHeader.type });

		fireEvent.click(sortByType);
		expect(rowOrder(view)).toStrictEqual(["Gamma", "Alpha", "Beta"]);

		fireEvent.click(sortByType);
		expect(rowOrder(view)).toStrictEqual(["Alpha", "Gamma", "Beta"]);
	});
});

describe("HolidaysTable card details", () => {
	const saturday = new Date(2026, 5, 6);

	it("shows a holiday's type, its location and a weekend badge on the mobile card when it has them", () => {
		holidaysState.holidays = [
			holiday({ id: "n-1", name: "Alpha", date: saturday, type: "public", location: "Barcelona" }),
		];
		const view = renderTable();

		expect(view.getAllByText("public").length).toBeGreaterThan(0);
		expect(view.getByText(/Barcelona/)).toBeTruthy();
		expect(view.getAllByText(enMessages.holidaysTable.weekend)).toHaveLength(2);
	});

	it("finds a holiday by its type or its location, not only by its name", () => {
		holidaysState.holidays = [
			holiday({ id: "n-1", name: "Alpha", date: new Date(2026, 0, 1), type: "public", location: "Barcelona" }),
			holiday({ id: "n-2", name: "Beta", date: new Date(2026, 5, 1), type: "bank" }),
		];
		const view = renderTable();

		search(view, "barcel");
		expect(view.getAllByLabelText(/^Select (?!all$)/).map((box) => box.getAttribute("aria-label"))).toStrictEqual([
			"Select Alpha",
			"Select Alpha",
		]);

		search(view, "bank");
		expect(view.getAllByLabelText(/^Select (?!all$)/).map((box) => box.getAttribute("aria-label"))).toStrictEqual([
			"Select Beta",
			"Select Beta",
		]);
	});
});

describe("HolidaysTable with no holidays at all", () => {
	it("says there are none, rather than that none were found, when nothing was searched for", () => {
		holidaysState.holidays = [];
		const view = renderTable();

		expect(view.getAllByText(enMessages.holidaysTable.noHolidays).length).toBeGreaterThan(0);
		expect(view.queryByText(enMessages.holidaysTable.noHolidaysFound)).toBeNull();
	});
});
