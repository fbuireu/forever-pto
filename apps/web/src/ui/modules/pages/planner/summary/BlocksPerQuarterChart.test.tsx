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
			<span data-testid="tooltip">{formatter(2).join(" | ")}</span>
		),
		XAxis: empty,
		YAxis: empty,
	};
});

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { BlocksPerQuarterChart } from "./BlocksPerQuarterChart";

interface RenderChartParams {
	locale: Locale;
	messages: object;
	blocksPerQuarter: number[];
}

const renderChart = ({ locale, messages, blocksPerQuarter }: RenderChartParams) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<BlocksPerQuarterChart blocksPerQuarter={blocksPerQuarter} />
		</NextIntlClientProvider>,
	);

describe("BlocksPerQuarterChart", () => {
	it("pluralises the block count with Italian plural rules", () => {
		const { container } = renderChart({ locale: "it", messages: itMessages, blocksPerQuarter: [2, 1, 0, 0] });
		expect(container.textContent).toContain("2 blocchi");
	});

	it("pluralises the block count with German plural rules", () => {
		const { container } = renderChart({ locale: "de", messages: deMessages, blocksPerQuarter: [2, 1, 0, 0] });
		expect(container.textContent).toContain("2 Blöcke");
	});

	it("uses the singular form for a single block", () => {
		const { container } = renderChart({ locale: "it", messages: itMessages, blocksPerQuarter: [1, 0, 0, 0] });
		expect(container.textContent).toContain("con 1 blocco.");
		expect(container.textContent).not.toContain("con 1 blocchi");
	});
});

describe("BlocksPerQuarterChart tooltip", () => {
	it("labels a bar with its block count and what a block is", () => {
		const { getByTestId } = renderChart({ locale: "en", messages: enMessages, blocksPerQuarter: [2, 1, 0, 0] });

		expect(getByTestId("tooltip").textContent).toBe(
			`2 ${enMessages.charts.blocks} | ${enMessages.charts.blocksOf3Days}`,
		);
	});
});

describe("BlocksPerQuarterChart with no blocks at all", () => {
	it("names no best quarter, since there is nothing to be best at", () => {
		const { container } = renderChart({ locale: "en", messages: enMessages, blocksPerQuarter: [0, 0, 0, 0] });

		expect(container.textContent).toContain("0 long blocks (3+ consecutive days) ideal for vacation.");
		expect(container.textContent).not.toContain("Best quarter");
	});
});
