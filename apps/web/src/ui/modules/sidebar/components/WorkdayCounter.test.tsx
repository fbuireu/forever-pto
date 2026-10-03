import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface CalendarModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	handleRangeSelect: (date: unknown) => void;
}

const holidays = vi.hoisted(() => ({ value: [] as HolidayDTO[] }));

const { lazyModal, MockCalendarModal } = vi.hoisted(() => ({
	lazyModal: { loader: undefined as (() => Promise<{ default: unknown }>) | undefined },
	MockCalendarModal: vi.fn().mockReturnValue(null),
}));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector({ holidays: holidays.value }),
}));

vi.mock("./WorkdayCounterCalendarModal", () => ({ WorkdayCounterCalendarModal: MockCalendarModal }));

vi.mock("next/dynamic", () => ({
	default: (loader: () => Promise<{ default: unknown }>) => {
		lazyModal.loader = loader;
		return (props: CalendarModalProps) => (
			<div data-testid="calendar-modal" data-open={String(props.open)}>
				<button type="button" onClick={() => props.setOpen(true)}>
					open
				</button>
				<button type="button" onClick={() => props.handleRangeSelect(range.value)}>
					pick
				</button>
				<button type="button" onClick={() => props.handleRangeSelect(undefined)}>
					unpick
				</button>
			</div>
		);
	},
}));

vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number }: { number: number }) => <span>{number}</span>,
}));

const range = vi.hoisted(() => ({ value: undefined as unknown }));

const { WorkdayCounter } = (await import("./WorkdayCounter")) as { WorkdayCounter: ComponentType };

const day = (isoDate: string) => new Date(`${isoDate}T00:00:00`);

const holiday = (isoDate: string): HolidayDTO => ({
	id: isoDate,
	date: day(isoDate),
	name: "Holiday",
	variant: HolidayVariant.NATIONAL,
	isInPlanningWindow: true,
});

const BUNDLES: Record<string, typeof en> = {
	en,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderCounterParams {
	locale?: Locale;
	messages?: typeof en;
}

const renderCounter = ({ locale = "en", messages = en }: RenderCounterParams = {}) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<WorkdayCounter />
		</NextIntlClientProvider>,
	);

interface PickParams {
	from: string;
	to: string;
}

const pick = ({ from, to }: PickParams) => {
	range.value = { from: day(from), to: day(to) };
	fireEvent.click(screen.getByRole("button", { name: "pick" }));
};

const unknownYearsWarning = /Holidays are only known for/;

const readout = () => document.body.textContent ?? "";

const counts = () =>
	Object.fromEntries(
		(["workdays", "days", "weekendDays", "holidays"] as const).map((key) => [
			key,
			screen.getByText(en.workdayCounter[key]).nextElementSibling?.textContent,
		]),
	);

beforeEach(() => {
	holidays.value = [];
	range.value = undefined;
});

describe("WorkdayCounter", () => {
	it("shows no counts at all until a range is picked", () => {
		renderCounter();

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
		expect(screen.queryByRole("button", { name: en.workdayCounter.clearSelection })).toBeNull();
	});

	it("counts the weekdays, the whole span and the weekend days of the range", () => {
		renderCounter();

		pick({ from: "2026-06-01", to: "2026-06-07" });

		expect(counts()).toStrictEqual({ workdays: "5", days: "7", weekendDays: "2", holidays: "0" });
	});

	it("does not count a Holiday as a workday, and counts it separately", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick({ from: "2026-06-01", to: "2026-06-07" });

		expect(counts()).toStrictEqual({ workdays: "4", days: "7", weekendDays: "2", holidays: "1" });
	});

	it("counts a single day as one day", () => {
		renderCounter();

		pick({ from: "2026-06-01", to: "2026-06-01" });

		expect(counts()).toStrictEqual({ workdays: "1", days: "1", weekendDays: "0", holidays: "0" });
	});

	it("keeps counting nothing while only one end has been picked", () => {
		renderCounter();
		fireEvent.click(screen.getByRole("button", { name: "open" }));

		range.value = { from: day("2026-06-01"), to: undefined };
		fireEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(screen.getByTestId("calendar-modal").dataset.open).toBe("true");
		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("ignores a single date, which is what the other selection modes hand it", () => {
		renderCounter();

		range.value = day("2026-06-01");
		fireEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("keeps the range it already counted when a half-picked one arrives after it", () => {
		renderCounter();
		pick({ from: "2026-06-01", to: "2026-06-07" });

		range.value = { from: day("2026-07-01"), to: undefined };
		fireEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(readout()).toContain("June 1, 2026");
	});

	it("closes the calendar once both ends are picked", () => {
		renderCounter();
		fireEvent.click(screen.getByRole("button", { name: "open" }));
		expect(screen.getByTestId("calendar-modal").dataset.open).toBe("true");

		pick({ from: "2026-06-01", to: "2026-06-07" });

		expect(screen.getByTestId("calendar-modal").dataset.open).toBe("false");
	});

	it("names the range it counted, so the numbers are attributable", () => {
		renderCounter();

		pick({ from: "2026-06-01", to: "2026-06-07" });

		expect(readout()).toContain(en.workdayCounter.dateRange);
		expect(readout()).toContain("June 1, 2026");
		expect(readout()).toContain("June 7, 2026");
	});

	it("clears the counts when the reader clears the selection", () => {
		renderCounter();
		pick({ from: "2026-06-01", to: "2026-06-07" });

		fireEvent.click(screen.getByRole("button", { name: en.workdayCounter.clearSelection }));

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("clears the counts when the calendar hands back nothing", () => {
		renderCounter();
		pick({ from: "2026-06-01", to: "2026-06-07" });

		fireEvent.click(screen.getByRole("button", { name: "unpick" }));

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("says so rather than counting silently when the range reaches past the Holidays it knows", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick({ from: "2027-06-01", to: "2027-06-07" });

		expect(screen.getByText(unknownYearsWarning)).toBeTruthy();
	});

	it("warns about a range that starts before the Holidays it knows, not only one that ends after", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick({ from: "2025-06-01", to: "2026-06-07" });

		expect(screen.getByText(unknownYearsWarning)).toBeTruthy();
	});

	it("says nothing about unknown years for a range the Holidays cover", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick({ from: "2026-06-01", to: "2026-06-07" });

		expect(screen.queryByText(unknownYearsWarning)).toBeNull();
	});

	it("says nothing about unknown years when it knows of no Holidays at all", () => {
		renderCounter();

		pick({ from: "2027-06-01", to: "2027-06-07" });

		expect(screen.queryByText(unknownYearsWarning)).toBeNull();
	});
});

describe("WorkdayCounter copy", () => {
	it("names the range it counted in one sentence", () => {
		renderCounter();

		pick({ from: "2026-06-01", to: "2026-06-07" });

		expect(screen.getByText(en.workdayCounter.dateRange).nextElementSibling?.textContent).toBe(
			"From Monday, June 1, 2026 to Sunday, June 7, 2026",
		);
	});

	it.each(Object.entries(BUNDLES))("names the %s range with both ends in place", (locale, messages) => {
		renderCounter({ locale: locale as Locale, messages });

		pick({ from: "2026-06-01", to: "2026-06-07" });
		const sentence = screen.getByText(messages.workdayCounter.dateRange).nextElementSibling?.textContent ?? "";

		expect(sentence).toMatch(/1.*2026.*7.*2026/);
		expect(sentence).not.toMatch(/[<>{}]|workdayCounter\./);
	});

	it("loads the calendar modal behind the split, from the export it names", async () => {
		expect((await lazyModal.loader?.())?.default).toBe(MockCalendarModal);
	});
});

describe("WorkdayCounter analytics", () => {
	it("reports the tool being used once a range is picked, without the range", () => {
		track.mockClear();
		renderCounter();

		pick({ from: "2026-06-01", to: "2026-06-07" });

		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "tool_used", properties: { tool: "workdayCounter" } });
		expect(JSON.stringify(track.mock.calls)).not.toContain("2026");
	});
});
