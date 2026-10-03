import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import ca from "@i18n/messages/ca.json";
import de from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import es from "@i18n/messages/es.json";
import fr from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
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

interface HolidayParams {
	variant: HolidayVariant;
	id: string;
}

const holiday = ({ variant, id }: HolidayParams): HolidayDTO => ({
	id,
	date: new Date(`2026-06-0${id}T00:00:00`),
	name: `Holiday ${id}`,
	variant,
	isInPlanningWindow: true,
});

interface RenderChartParams {
	ptoDays: number;
	holidays?: HolidayDTO[];
	locale?: Locale;
	messages?: object;
}

const BUNDLES = { en, es, ca, it: itMessages, de, fr };

const renderChart = ({ ptoDays, holidays = [], locale = "en", messages = en }: RenderChartParams) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<HolidaysDistributionChart ptoDays={ptoDays} holidays={holidays} />
		</NextIntlClientProvider>,
	);

const slices = () =>
	JSON.parse(screen.getByTestId("slices").textContent ?? "[]") as { name: string; value: number; color: string }[];

const oneOfEach = [
	holiday({ variant: HolidayVariant.NATIONAL, id: "1" }),
	holiday({ variant: HolidayVariant.NATIONAL, id: "2" }),
	holiday({ variant: HolidayVariant.REGIONAL, id: "3" }),
	holiday({ variant: HolidayVariant.CUSTOM, id: "4" }),
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
		renderChart({ ptoDays: 20, holidays: [holiday({ variant: HolidayVariant.NATIONAL, id: "1" })] });

		expect(slices().map(({ name }) => name)).toStrictEqual([en.charts.pto, en.charts.national]);
	});

	it("leaves the budget out too when there is none to spend", () => {
		renderChart({ ptoDays: 0, holidays: [holiday({ variant: HolidayVariant.NATIONAL, id: "1" })] });

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

		expect(document.body.textContent).toContain(
			"Distribution of your 20 PTO days, 2 national holidays, 1 regional and 1 custom.",
		);
	});

	it("says nothing about regional or custom days when there are none", () => {
		renderChart({
			ptoDays: 20,
			holidays: [
				holiday({ variant: HolidayVariant.NATIONAL, id: "1" }),
				holiday({ variant: HolidayVariant.NATIONAL, id: "2" }),
			],
		});

		expect(document.body.textContent).toContain("Distribution of your 20 PTO days, 2 national holidays.");
	});

	it("lets a locale place the optional parts itself, since the sentence is one message", () => {
		renderChart({ ptoDays: 20, holidays: oneOfEach, locale: "de", messages: de });

		expect(document.body.textContent).toContain(
			"Verteilung deiner 20 PTO-Tage, 2 nationalen Feiertage, 1 regionalen und 1 eigenen.",
		);
	});

	it.each(Object.entries(BUNDLES))(
		"renders the %s description whole, with no placeholder left over",
		(locale, messages) => {
			const { container } = renderChart({ ptoDays: 20, holidays: oneOfEach, locale: locale as Locale, messages });
			const description = container.querySelector(".text-xs.text-muted-foreground.mt-1")?.textContent ?? "";

			expect(description).toContain("20");
			expect(description).not.toMatch(/[{}]|charts\./);
		},
	);

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
