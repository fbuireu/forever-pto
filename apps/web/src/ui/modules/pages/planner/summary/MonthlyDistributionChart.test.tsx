import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

interface TooltipMockProps {
	formatter: (value: number) => [string, string];
	labelFormatter: (label: string) => string;
}

vi.mock("recharts", () => {
	const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
	const empty = () => null;
	return {
		Area: empty,
		AreaChart: ({ children, data }: { children?: ReactNode; data: unknown }) => (
			<div>
				<span data-testid="area-data">{JSON.stringify(data)}</span>
				{children}
			</div>
		),
		CartesianGrid: empty,
		ResponsiveContainer: passthrough,
		Tooltip: ({ formatter, labelFormatter }: TooltipMockProps) => (
			<div>
				<span data-testid="value">{formatter(3).join(" | ")}</span>
				<span data-testid="january">{labelFormatter("Jan")}</span>
				<span data-testid="carry-over">{labelFormatter("Jan '27")}</span>
				<span data-testid="unknown">{labelFormatter("not a month")}</span>
			</div>
		),
		XAxis: empty,
		YAxis: empty,
	};
});

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { MonthlyDistributionChart } from "./MonthlyDistributionChart";

interface RenderChartParams {
	monthlyDist: number[];
	year?: number;
	carryOverMonths?: number;
}

const renderChart = ({ monthlyDist, year = 2026, carryOverMonths = 0 }: RenderChartParams) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<MonthlyDistributionChart monthlyDist={monthlyDist} year={year} carryOverMonths={carryOverMonths} />
		</NextIntlClientProvider>,
	);

const points = () => JSON.parse(screen.getByTestId("area-data").textContent ?? "[]") as { mes: string; days: number }[];

const evenlySpread = new Array(12).fill(1);

interface DescribedAsParams {
	totalDays: string;
	activeMonths: string;
	peakMonth: string;
	peakDays: string;
}

const describedAs = ({ totalDays, activeMonths, peakMonth, peakDays }: DescribedAsParams) =>
	en.charts.timelineDescription
		.replace("{totalDays}", totalDays)
		.replace("{activeMonths}", activeMonths)
		.replace("{peakMonth}", peakMonth)
		.replace("{peakDays}", peakDays);

describe("MonthlyDistributionChart", () => {
	it("plots one point per month of the year", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(points()).toHaveLength(12);
		expect(points()[0]?.mes).toBe("Jan");
		expect(points().at(-1)?.mes).toBe("Dec");
	});

	it("widens the plot by the carried-over months, and names them with the year they fall in", () => {
		renderChart({ monthlyDist: evenlySpread, carryOverMonths: 3 });

		expect(points()).toHaveLength(15);
		expect(points().at(-1)?.mes).toBe("Mar '27");
	});

	it("pads the carried-over months with nought rather than leaving the plot short", () => {
		renderChart({ monthlyDist: evenlySpread, carryOverMonths: 2 });

		expect(
			points()
				.slice(12)
				.map(({ days }) => days),
		).toStrictEqual([0, 0]);
	});

	it("plots the days it was given, month for month", () => {
		const distribution = [0, 0, 2, 0, 1, 0, 0, 5, 0, 0, 0, 0];

		renderChart({ monthlyDist: distribution });

		expect(points().map(({ days }) => days)).toStrictEqual(distribution);
	});

	it("reports the total, the months in play and the busiest of them", () => {
		renderChart({ monthlyDist: [0, 0, 2, 0, 1, 0, 0, 5, 0, 0, 0, 0] });

		expect(document.body.textContent).toContain(
			describedAs({ totalDays: "8", activeMonths: "3", peakMonth: "Aug", peakDays: "5" }),
		);
	});

	it("counts only the months that hold a day as active", () => {
		renderChart({ monthlyDist: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });

		expect(document.body.textContent).toContain(
			describedAs({ totalDays: "4", activeMonths: "1", peakMonth: "Jan", peakDays: "4" }),
		);
	});

	it("names the first of the joint busiest months rather than reporting a tie", () => {
		renderChart({ monthlyDist: [3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0] });

		expect(document.body.textContent).toContain(
			describedAs({ totalDays: "6", activeMonths: "2", peakMonth: "Jan", peakDays: "3" }),
		);
	});

	it("spells the hovered month out in full, since the axis only has room for three letters", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(screen.getByTestId("january").textContent).toBe("January 2026");
	});

	it("spells a carried-over month out with the year it belongs to", () => {
		renderChart({ monthlyDist: evenlySpread, carryOverMonths: 1 });

		expect(screen.getByTestId("carry-over").textContent).toBe("January 2027");
	});

	it("shows a label it cannot expand rather than nothing", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(screen.getByTestId("unknown").textContent).toBe("not a month");
	});

	it("says what the hovered number counts", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(screen.getByTestId("value").textContent).toBe(`3 ${en.charts.days} | ${en.charts.daysOffLabel}`);
	});
});
