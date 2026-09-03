import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

interface LegendMockProps {
	content: (props: { payload?: { value: string; color: string }[] }) => ReactNode;
}

interface TooltipMockProps {
	formatter: (value: number, name: string) => [string, string];
}

vi.mock("recharts", () => {
	const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
	return {
		Cell: ({ fill }: { fill: string }) => <span data-testid="cell" data-fill={fill} />,
		Legend: ({ content }: LegendMockProps) => (
			<div>
				<div data-testid="legend">
					{content({
						payload: [
							{ value: "PTO", color: "var(--first)" },
							{ value: "National", color: "var(--second)" },
						],
					})}
				</div>
				<div data-testid="legend-without-payload">{content({})}</div>
			</div>
		),
		Pie: ({ children, data }: { children?: ReactNode; data: unknown }) => (
			<div>
				<span data-testid="slices">{JSON.stringify(data)}</span>
				{children}
			</div>
		),
		PieChart: passthrough,
		ResponsiveContainer: passthrough,
		Tooltip: ({ formatter }: TooltipMockProps) => <span data-testid="tooltip">{formatter(5, "PTO").join(" | ")}</span>,
	};
});

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { HolidaysDistributionChart } from "./HolidaysDistributionChart";

const holiday = (variant: HolidayVariant, id: string): HolidayDTO => ({
	id,
	date: new Date(`2026-06-0${id}T00:00:00`),
	name: `Holiday ${id}`,
	variant,
	isInPlanningWindow: true,
});

interface RenderChartParams {
	ptoDays: number;
	holidays?: HolidayDTO[];
}

const renderChart = ({ ptoDays, holidays = [] }: RenderChartParams) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<HolidaysDistributionChart ptoDays={ptoDays} holidays={holidays} />
		</NextIntlClientProvider>,
	);

const slices = () =>
	JSON.parse(screen.getByTestId("slices").textContent ?? "[]") as { name: string; value: number; color: string }[];

const oneOfEach = [
	holiday(HolidayVariant.NATIONAL, "1"),
	holiday(HolidayVariant.NATIONAL, "2"),
	holiday(HolidayVariant.REGIONAL, "3"),
	holiday(HolidayVariant.CUSTOM, "4"),
];

describe("HolidaysDistributionChart", () => {
	it("counts each Holiday against the Variant it carries", () => {
		renderChart({ ptoDays: 20, holidays: oneOfEach });

		expect(slices()).toStrictEqual([
			{ name: en.charts.pto, value: 20, color: expect.any(String) },
			{ name: en.charts.national, value: 2, color: expect.any(String) },
			{ name: en.charts.regional, value: 1, color: expect.any(String) },
			{ name: en.charts.custom, value: 1, color: expect.any(String) },
		]);
	});

	it("leaves out a Variant nothing falls under, rather than drawing a slice of nought", () => {
		renderChart({ ptoDays: 20, holidays: [holiday(HolidayVariant.NATIONAL, "1")] });

		expect(slices().map(({ name }) => name)).toStrictEqual([en.charts.pto, en.charts.national]);
	});

	it("leaves the budget out too when there is none to spend", () => {
		renderChart({ ptoDays: 0, holidays: [holiday(HolidayVariant.NATIONAL, "1")] });

		expect(slices().map(({ name }) => name)).toStrictEqual([en.charts.national]);
	});

	it("gives each slice a colour of its own, so the legend can be read", () => {
		renderChart({ ptoDays: 20, holidays: oneOfEach });

		const fills = screen.getAllByTestId("cell").map((cell) => cell.dataset.fill);

		expect(fills).toHaveLength(4);
		expect(new Set(fills).size).toBe(4);
	});

	it("names the regional and custom counts only when it has some to name", () => {
		renderChart({ ptoDays: 20, holidays: oneOfEach });

		expect(document.body.textContent).toContain(en.charts.regionalPart.replace("{regionalDays}", "1"));
		expect(document.body.textContent).toContain(en.charts.customPart.replace("{customDays}", "1"));
	});

	it("says nothing about regional or custom days when there are none", () => {
		renderChart({ ptoDays: 20, holidays: [holiday(HolidayVariant.NATIONAL, "1")] });

		expect(document.body.textContent).not.toContain(en.charts.regionalPart.replace("{regionalDays}", "0"));
		expect(document.body.textContent).not.toContain(en.charts.customPart.replace("{customDays}", "0"));
	});

	it("draws one legend entry per series, each swatched in that series' own colour", () => {
		renderChart({ ptoDays: 20, holidays: oneOfEach });

		const entries = screen.getByTestId("legend").querySelectorAll("li");

		expect(entries).toHaveLength(2);
		expect(entries[0]?.textContent).toBe("PTO");
		expect(entries[0]?.querySelector("span")?.style.backgroundColor).toBe("var(--first)");
		expect(entries[1]?.querySelector("span")?.style.backgroundColor).toBe("var(--second)");
	});

	it("draws no entries at all when recharts hands the legend no payload", () => {
		renderChart({ ptoDays: 20, holidays: oneOfEach });

		expect(screen.getByTestId("legend-without-payload").querySelectorAll("li")).toHaveLength(0);
	});
});

describe("HolidaysDistributionChart tooltip", () => {
	it("labels a slice with its day count and keeps the series name recharts handed it", () => {
		renderChart({ ptoDays: 20, holidays: oneOfEach });

		expect(screen.getByTestId("tooltip").textContent).toBe(`5 ${en.charts.days} | PTO`);
	});
});
