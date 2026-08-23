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
	isInSelectedRange: true,
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
		fireEvent.click(view.getByLabelText("Select Gamma"));
		expect((view.getByLabelText("Select Gamma") as HTMLInputElement).checked).toBe(true);

		fireEvent.change(view.getByPlaceholderText(enMessages.holidaysTable.searchPlaceholder), {
			target: { value: "Gamma" },
		});

		expect((view.getByLabelText("Select Gamma") as HTMLInputElement).checked).toBe(true);
		expect(view.getByTestId("delete-modal").getAttribute("data-names")).toBe("Gamma");
		expect(view.getByTestId("edit-modal").getAttribute("data-name")).toBe("Gamma");
	});

	it("keeps a Holiday selected when sorting by name reorders it", () => {
		const view = renderTable();
		fireEvent.click(view.getByLabelText("Select Alpha"));

		const sortByName = view.getByRole("button", { name: enMessages.holidayTableHeader.holiday });
		fireEvent.click(sortByName);
		fireEvent.click(sortByName);

		expect(
			view.getByRole("columnheader", { name: enMessages.holidayTableHeader.holiday }).getAttribute("aria-sort"),
		).toBe("descending");
		expect((view.getByLabelText("Select Alpha") as HTMLInputElement).checked).toBe(true);
		expect(view.getByTestId("delete-modal").getAttribute("data-names")).toBe("Alpha");
	});
});

describe("HolidaysTable toolbar counts what it will act on", () => {
	it("offers to delete exactly the Holidays the modal will receive", () => {
		const view = renderTable();
		fireEvent.click(view.getByLabelText("Select Alpha"));
		fireEvent.click(view.getByLabelText("Select Beta"));

		expect(view.getByTestId("delete-modal").getAttribute("data-names")).toBe("Alpha,Beta");
		expect(view.getAllByText("Delete (2)").length).toBeGreaterThan(0);
	});

	it("drops a selected Holiday from the count once it leaves the list entirely", () => {
		const view = renderTable();
		fireEvent.click(view.getByLabelText("Select Gamma"));

		holidaysState.holidays = holidaysState.holidays.slice(0, 2);
		fireEvent.change(view.getByPlaceholderText(enMessages.holidaysTable.searchPlaceholder), {
			target: { value: "a" },
		});

		expect(view.queryByTestId("delete-modal")?.getAttribute("data-names")).toBe("");
		expect(view.queryByTestId("edit-modal")).toBeNull();
	});
});
