import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateIcs, holidaysState } = vi.hoisted(() => ({
	mockGenerateIcs: vi.fn((_params: { holidays: { id: string }[] }) => "BEGIN:VCALENDAR"),
	holidaysState: {
		holidays: [] as { id: string; date: Date; name: string; isInSelectedRange: boolean }[],
		suggestion: null as { days: Date[] } | null,
		currentSelection: null as { days: Date[] } | null,
		manuallySelectedDays: [] as Date[],
		removedSuggestedDays: [] as Date[],
	},
}));

vi.mock("@application/export/generateIcs", () => ({ generateIcs: mockGenerateIcs }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ year: 2026 }),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector(holidaysState),
}));

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => Object.assign((key: string) => key, { rich: (key: string) => key }),
}));

const { CalendarExport } = await import("./CalendarExport");

const makeHoliday = (id: string, date: string, isInSelectedRange: boolean) => ({
	id,
	date: new Date(date),
	name: `Holiday ${id}`,
	isInSelectedRange,
});

beforeEach(() => {
	vi.clearAllMocks();
	holidaysState.holidays = [];
	holidaysState.suggestion = null;
	holidaysState.currentSelection = null;
	holidaysState.manuallySelectedDays = [];
	holidaysState.removedSuggestedDays = [];

	Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:x"), writable: true });
	Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });
});

describe("CalendarExport", () => {
	it("exports only the Holidays inside the Planning Window, not the extra year the store keeps for context", async () => {
		holidaysState.holidays = [
			makeHoliday("in-1", "2026-01-01", true),
			makeHoliday("in-2", "2026-12-25", true),
			makeHoliday("out-1", "2027-01-01", false),
			makeHoliday("out-2", "2027-12-25", false),
		];

		render(<CalendarExport />);
		await userEvent.click(screen.getByRole("button", { name: "download" }));

		expect(mockGenerateIcs).toHaveBeenCalled();
		const passed = mockGenerateIcs.mock.lastCall?.[0];
		expect(passed?.holidays.map((h) => h.id)).toEqual(["in-1", "in-2"]);
	});

	it("treats a window with no Holidays in it as nothing to export", () => {
		holidaysState.holidays = [makeHoliday("out-1", "2027-01-01", false)];

		render(<CalendarExport />);

		expect(screen.getByRole("button", { name: "download" })).toHaveProperty("disabled", true);
	});
});
