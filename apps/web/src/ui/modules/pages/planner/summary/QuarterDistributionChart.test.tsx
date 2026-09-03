import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import itMessages from "@i18n/messages/it.json";
import { render } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => {
	const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
	const empty = () => null;
	return {
		Bar: passthrough,
		BarChart: passthrough,
		CartesianGrid: empty,
		Cell: empty,
		ResponsiveContainer: passthrough,
		Tooltip: ({ formatter }: { formatter: (value: number) => [string, string] }) => (
			<span data-testid="tooltip">{formatter(3).join(" | ")}</span>
		),
		XAxis: empty,
		YAxis: empty,
	};
});

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { QuarterDistributionChart } from "./QuarterDistributionChart";

interface RenderChartParams {
	locale: Locale;
	messages: object;
	quarterDist: number[];
}

const renderChart = ({ locale, messages, quarterDist }: RenderChartParams) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<QuarterDistributionChart quarterDist={quarterDist} />
		</NextIntlClientProvider>,
	);

describe("QuarterDistributionChart", () => {
	it("pluralises the quarter count with Italian plural rules", () => {
		const { container } = renderChart({ locale: "it", messages: itMessages, quarterDist: [3, 2, 2, 1] });
		expect(container.textContent).toContain("4 trimestri");
	});

	it("pluralises the quarter count with German plural rules", () => {
		const { container } = renderChart({ locale: "de", messages: deMessages, quarterDist: [3, 2, 2, 1] });
		expect(container.textContent).toContain("4 Quartale");
	});

	it("uses the singular form when a single quarter is active", () => {
		const { container } = renderChart({ locale: "it", messages: itMessages, quarterDist: [8, 0, 0, 0] });
		expect(container.textContent).toContain("1 trimestre");
		expect(container.textContent).not.toContain("trimestri");
	});
});

describe("QuarterDistributionChart tooltip", () => {
	it("labels a bar with its day count and what the bar measures", () => {
		const { getByTestId } = renderChart({ locale: "en", messages: enMessages, quarterDist: [3, 2, 2, 1] });

		expect(getByTestId("tooltip").textContent).toBe(`3 ${enMessages.charts.days} | ${enMessages.charts.daysOff}`);
	});
});
