import { HolidayVariant } from "@application/dto/holiday/types";
import enMessages from "@i18n/messages/en.json";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { YearTimelineChart } from "./YearTimelineChart";

const YEAR = 2026;

const makeHoliday = (date: Date, variant: HolidayVariant = HolidayVariant.NATIONAL) => ({
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
			holidays: [makeHoliday(new Date(YEAR, 0, 15))],
		});
		const carryOver = renderChart({
			carryOverMonths: 1,
			holidays: [makeHoliday(new Date(YEAR + 1, 0, 15))],
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
			holidays: [makeHoliday(new Date(YEAR + 1, 0, 1))],
		});

		expect(leftPercents(container).at(0)).toBeCloseTo((12 / 13) * 100, 4);
	});

	it("places 1 January of the planning year at the very start", () => {
		const { container } = renderChart({
			carryOverMonths: 1,
			holidays: [makeHoliday(new Date(YEAR, 0, 1))],
		});

		expect(leftPercents(container).at(0)).toBe(0);
	});
});
