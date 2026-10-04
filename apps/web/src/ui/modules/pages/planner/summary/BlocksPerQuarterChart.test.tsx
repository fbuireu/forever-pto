import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render } from "@testing-library/react";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
			<>
				<span data-testid="tooltip">{formatter(2).join(" | ")}</span>
				<span data-testid="tooltip-one">{formatter(1).join(" | ")}</span>
			</>
		),
		XAxis: empty,
		YAxis: empty,
	};
});

const longBlockMinimum = vi.hoisted(() => ({ override: undefined as number | undefined }));

vi.mock("@domain/calendar/const", async (importOriginal) => {
	const { PTO_CONSTANTS } = await importOriginal<typeof import("@domain/calendar/const")>();
	return {
		PTO_CONSTANTS: {
			...PTO_CONSTANTS,
			METRICS: {
				...PTO_CONSTANTS.METRICS,
				get LONG_BLOCK_MINIMUM_DAYS() {
					return longBlockMinimum.override ?? PTO_CONSTANTS.METRICS.LONG_BLOCK_MINIMUM_DAYS;
				},
			},
		},
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

		expect(getByTestId("tooltip").textContent).toBe("2 blocks | Blocks of 3+ days");
		expect(getByTestId("tooltip-one").textContent).toBe("1 block | Blocks of 3+ days");
	});
});

describe("BlocksPerQuarterChart with no blocks at all", () => {
	it("names no best quarter, since there is nothing to be best at", () => {
		const { container } = renderChart({ locale: "en", messages: enMessages, blocksPerQuarter: [0, 0, 0, 0] });

		expect(container.textContent).toContain("0 long blocks (3+ consecutive days) ideal for vacation.");
		expect(container.textContent).not.toContain("Best quarter");
	});
});

describe("BlocksPerQuarterChart description", () => {
	const BUNDLES = { en: enMessages, es: esMessages, ca: caMessages, it: itMessages, de: deMessages, fr: frMessages };

	it("names the best quarter in the same sentence as the total", () => {
		const { container } = renderChart({ locale: "en", messages: enMessages, blocksPerQuarter: [2, 1, 0, 0] });

		expect(container.textContent).toContain(
			"3 long blocks (3+ consecutive days) ideal for vacation. Best quarter: Q1 with 2 blocks.",
		);
	});

	it.each(Object.entries(BUNDLES))("renders the %s sentence whole, with blocks and without", (locale, messages) => {
		for (const blocksPerQuarter of [
			[2, 1, 0, 0],
			[0, 0, 0, 0],
		]) {
			const { container, unmount } = renderChart({ locale: locale as Locale, messages, blocksPerQuarter });

			expect(container.textContent).toContain(String(blocksPerQuarter[0] + blocksPerQuarter[1]));
			expect(container.textContent).not.toMatch(/[{}]|charts\./);
			unmount();
		}
	});
});

describe("BlocksPerQuarterChart Long Block minimum", () => {
	const BUNDLES = { en: enMessages, es: esMessages, ca: caMessages, it: itMessages, de: deMessages, fr: frMessages };
	const STATED_MINIMUM = /\b(\d+)(?:\+| o més)/g;

	afterEach(() => {
		longBlockMinimum.override = undefined;
	});

	it.each(Object.entries(BUNDLES))(
		"states in %s the minimum the engine counts a Long Block from, in the description and the tooltip",
		(locale, messages) => {
			longBlockMinimum.override = 5;
			const { container, getByTestId } = renderChart({
				locale: locale as Locale,
				messages,
				blocksPerQuarter: [2, 1, 0, 0],
			});
			const stated = [...(container.textContent ?? "").matchAll(STATED_MINIMUM)].map(([, days]) => days);

			expect(stated).toEqual(["5", "5", "5"]);
			expect(getByTestId("tooltip").textContent).toMatch(/\b5\+/);
		},
	);
});

describe("BlocksPerQuarterChart description at the plural edges", () => {
	it.each([
		["en", [0, 0, 0, 0], "0 long blocks (3+ consecutive days) ideal for vacation.", enMessages],
		[
			"en",
			[1, 0, 0, 0],
			"1 long block (3+ consecutive days) ideal for vacation. Best quarter: Q1 with 1 block.",
			enMessages,
		],
		[
			"en",
			[0, 1, 2, 0],
			"3 long blocks (3+ consecutive days) ideal for vacation. Best quarter: Q3 with 2 blocks.",
			enMessages,
		],
		["es", [0, 0, 0, 0], "0 bloques largos (3+ días consecutivos) ideales para vacaciones.", esMessages],
		[
			"es",
			[1, 0, 0, 0],
			"1 bloque largo (3+ días consecutivos) ideal para vacaciones. Mejor trimestre: Q1 con 1 bloque.",
			esMessages,
		],
		[
			"es",
			[0, 1, 2, 0],
			"3 bloques largos (3+ días consecutivos) ideales para vacaciones. Mejor trimestre: Q3 con 2 bloques.",
			esMessages,
		],
	] as const)("counts the %s Long Blocks of %j in one sentence", (locale, blocksPerQuarter, expected, messages) => {
		const { container } = renderChart({ locale, messages, blocksPerQuarter: [...blocksPerQuarter] });

		expect(container.textContent).toContain(expected);
	});
});
