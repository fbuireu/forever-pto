import { HolidayVariant } from "@application/dto/holiday/types";
import enMessages from "@i18n/messages/en.json";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { YearTimelineChart } from "./YearTimelineChart";

const YEAR = 2026;

interface MakeHolidayParams {
	date: Date;
	variant?: HolidayVariant;
}

const makeHoliday = ({ date, variant = HolidayVariant.NATIONAL }: MakeHolidayParams) => ({
	id: `h-${date.toISOString()}`,
	date,
	name: "Test Holiday",
	variant,
	isInPlanningWindow: true,
});

const renderChart = (props: Partial<Parameters<typeof YearTimelineChart>[0]> = {}) =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<YearTimelineChart
				year={YEAR}
				carryOverMonths={0}
				holidays={[]}
				suggestion={null}
				manuallySelectedDays={[]}
				{...props}
			/>
		</NextIntlClientProvider>,
	);

const leftPercents = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('[style*="left"]')).map((node) =>
		Number.parseFloat(node.style.left),
	);

describe("YearTimelineChart", () => {
	it("renders one column per Planning Window month", () => {
		const { container } = renderChart({ carryOverMonths: 1 });
		const header = container.querySelector<HTMLElement>('[style*="grid-template-columns"]');

		expect(header?.style.gridTemplateColumns).toBe("repeat(13, minmax(0, 1fr))");
		expect(header?.children).toHaveLength(13);
	});

	it("does not fold a Carry-over Month date onto the same year January", () => {
		const january = renderChart({
			carryOverMonths: 1,
			holidays: [makeHoliday({ date: new Date(YEAR, 0, 15) })],
		});
		const carryOver = renderChart({
			carryOverMonths: 1,
			holidays: [makeHoliday({ date: new Date(YEAR + 1, 0, 15) })],
		});

		const januaryLeft = leftPercents(january.container).at(0);
		const carryOverLeft = leftPercents(carryOver.container).at(0);

		expect(januaryLeft).toBeDefined();
		expect(carryOverLeft).toBeDefined();
		expect(carryOverLeft).toBeGreaterThan(januaryLeft as number);
	});

	it("places 1 January of the Carry-over year on the thirteenth column, not the first", () => {
		const { container } = renderChart({
			carryOverMonths: 1,
			holidays: [makeHoliday({ date: new Date(YEAR + 1, 0, 1) })],
		});

		expect(leftPercents(container).at(0)).toBeCloseTo((12 / 13) * 100, 4);
	});

	it("places 1 January of the planning year at the very start", () => {
		const { container } = renderChart({
			carryOverMonths: 1,
			holidays: [makeHoliday({ date: new Date(YEAR, 0, 1) })],
		});

		expect(leftPercents(container).at(0)).toBe(0);
	});
});

const day = (month: number, date: number) => new Date(YEAR, month, date);

const rowLabels = (container: HTMLElement) =>
	[...container.querySelectorAll<HTMLElement>(".w-\\[70px\\]")]
		.map((node) => node.textContent ?? "")
		.filter((text) => text !== "");

const rowFor = (container: HTMLElement, label: string) => {
	const cell = [...container.querySelectorAll<HTMLElement>(".w-\\[70px\\]")].find((node) => node.textContent === label);
	return cell?.nextElementSibling as HTMLElement;
};

const segmentCount = (container: HTMLElement, label: string) =>
	rowFor(container, label).querySelectorAll('[style*="left"]').length;

const suggestionOf = (days: Date[], bridges: { startDate: Date; endDate: Date }[] = []) => ({ days, bridges }) as never;

describe("YearTimelineChart rows", () => {
	it("shows only the rows it has something to draw on", () => {
		const { container } = renderChart({ holidays: [makeHoliday({ date: day(0, 1) })] });

		expect(rowLabels(container)).toStrictEqual([enMessages.summary.yearTimeline.rows.national]);
	});

	it("keeps each Holiday Variant on its own row", () => {
		const { container } = renderChart({
			holidays: [
				makeHoliday({ date: day(0, 1) }),
				makeHoliday({ date: day(1, 1), variant: HolidayVariant.REGIONAL }),
				makeHoliday({ date: day(2, 1), variant: HolidayVariant.CUSTOM }),
			],
		});

		expect(rowLabels(container)).toStrictEqual([
			enMessages.summary.yearTimeline.rows.national,
			enMessages.summary.yearTimeline.rows.regional,
			enMessages.summary.yearTimeline.rows.custom,
		]);
	});

	it("draws a Bridge as the stretch it spans, not as its two ends", () => {
		const { container } = renderChart({
			suggestion: suggestionOf([], [{ startDate: day(5, 1), endDate: day(5, 7) }]),
		});

		expect(segmentCount(container, enMessages.summary.yearTimeline.rows.bridges)).toBe(1);
	});

	it("draws each hand-picked day on its own", () => {
		const { container } = renderChart({ manuallySelectedDays: [day(5, 1), day(8, 12)] });

		expect(segmentCount(container, enMessages.summary.yearTimeline.rows.manual)).toBe(2);
	});
});

describe("the PTO Days the chart groups into stretches", () => {
	const ptoSegments = (days: Date[]) => {
		const { container } = renderChart({ suggestion: suggestionOf(days) });
		return segmentCount(container, enMessages.summary.yearTimeline.rows.pto);
	};

	it("draws consecutive days as one stretch rather than as a row of dots", () => {
		expect(ptoSegments([day(5, 1), day(5, 2), day(5, 3)])).toBe(1);
	});

	it("bridges a weekend-sized gap, which is what makes a stretch read as time off", () => {
		expect(ptoSegments([day(5, 5), day(5, 8)])).toBe(1);
	});

	it("splits once the gap is wider than that", () => {
		expect(ptoSegments([day(5, 1), day(5, 9)])).toBe(2);
	});

	it("groups days handed to it out of order", () => {
		expect(ptoSegments([day(5, 3), day(5, 1), day(5, 2)])).toBe(1);
	});

	it("draws a single day as a stretch of one", () => {
		expect(ptoSegments([day(5, 1)])).toBe(1);
	});

	it("draws no row at all when the plan placed nothing", () => {
		const { container } = renderChart({ suggestion: suggestionOf([]) });

		expect(rowLabels(container)).toStrictEqual([]);
	});
});
