import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import { render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
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
				<span data-testid="value-one">{formatter(1).join(" | ")}</span>
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
	locale?: Locale;
	messages?: typeof en;
}

const renderChart = ({ monthlyDist, year = 2026, locale = "en", messages = en }: RenderChartParams) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<MonthlyDistributionChart monthlyDist={monthlyDist} year={year} />
		</NextIntlClientProvider>,
	);

const points = () => JSON.parse(screen.getByTestId("area-data").textContent ?? "[]") as { mes: string; days: number }[];

const evenlySpread = new Array(12).fill(1);

describe("MonthlyDistributionChart", () => {
	it("plots one point per month of the year", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(points()).toHaveLength(12);
		expect(points()[0]?.mes).toBe("Jan");
		expect(points().at(-1)?.mes).toBe("Dec");
	});

	it("plots every month the engine measured, and names one past December with the year it falls in", () => {
		renderChart({ monthlyDist: new Array(15).fill(1) });

		expect(points()).toHaveLength(15);
		expect(points().at(-1)?.mes).toBe("Mar '27");
	});

	it("sizes the plot from the array it was given, never padding it with months the engine did not measure", () => {
		renderChart({ monthlyDist: [1, 0, 2] });

		expect(points().map(({ days }) => days)).toStrictEqual([1, 0, 2]);
	});

	it("plots the days it was given, month for month", () => {
		const distribution = [0, 0, 2, 0, 1, 0, 0, 5, 0, 0, 0, 0];

		renderChart({ monthlyDist: distribution });

		expect(points().map(({ days }) => days)).toStrictEqual(distribution);
	});

	it("reports the total, the months in play and the busiest of them", () => {
		renderChart({ monthlyDist: [0, 0, 2, 0, 1, 0, 0, 5, 0, 0, 0, 0] });

		expect(document.body.textContent).toContain(
			"Monthly evolution of 8 PTO days distributed across 3 months. Peak in Aug with 5 days.",
		);
	});

	it("counts only the months that hold a day as active", () => {
		renderChart({ monthlyDist: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });

		expect(document.body.textContent).toContain(
			"Monthly evolution of 4 PTO days distributed across 1 month. Peak in Jan with 4 days.",
		);
	});

	it("names the first of the joint busiest months rather than reporting a tie", () => {
		renderChart({ monthlyDist: [3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0] });

		expect(document.body.textContent).toContain(
			"Monthly evolution of 6 PTO days distributed across 2 months. Peak in Jan with 3 days.",
		);
	});

	it("spells the hovered month out in full, since the axis only has room for three letters", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(screen.getByTestId("january").textContent).toBe("January 2026");
	});

	it("spells a carried-over month out with the year it belongs to", () => {
		renderChart({ monthlyDist: new Array(13).fill(1) });

		expect(screen.getByTestId("carry-over").textContent).toBe("January 2027");
	});

	it("shows a label it cannot expand rather than nothing", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(screen.getByTestId("unknown").textContent).toBe("not a month");
	});

	it("says what the hovered number counts", () => {
		renderChart({ monthlyDist: evenlySpread });

		expect(screen.getByTestId("value").textContent).toBe("3 days | PTO days");
		expect(screen.getByTestId("value-one").textContent).toBe("1 day | PTO days");
	});
});

describe("MonthlyDistributionChart description at the plural edges", () => {
	const onlyJanuary = (days: number) => [days, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

	it.each([
		[
			"en",
			en,
			onlyJanuary(1),
			/^Monthly evolution of 1 PTO day distributed across 1 month\. Peak in \S+ with 1 day\.$/,
		],
		[
			"en",
			en,
			onlyJanuary(0),
			/^Monthly evolution of 0 PTO days distributed across 0 months\. Peak in \S+ with 0 days\.$/,
		],
		["es", es, onlyJanuary(1), /^Evolución mensual de 1 día de PTO distribuido en 1 mes\. Pico en \S+ con 1 día\.$/],
		[
			"es",
			es,
			onlyJanuary(0),
			/^Evolución mensual de 0 días de PTO distribuidos en 0 meses\. Pico en \S+ con 0 días\.$/,
		],
		[
			"es",
			es,
			[3, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			/^Evolución mensual de 8 días de PTO distribuidos en 2 meses\. Pico en \S+ con 5 días\.$/,
		],
	] as const)("counts the %s PTO Days in one sentence", (locale, messages, monthlyDist, expected) => {
		const { container } = renderChart({ monthlyDist: [...monthlyDist], locale, messages });

		expect(container.querySelector(".text-xs.text-muted-foreground.mt-1")?.textContent).toMatch(expected);
	});
});
