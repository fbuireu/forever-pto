import caMessages from "@i18n/messages/ca.json";
import de from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setPreviewAlternativeSelection, resetManualSelection, askForPlan, readout } = vi.hoisted(() => ({
	setPreviewAlternativeSelection: vi.fn(),
	resetManualSelection: vi.fn(),
	askForPlan: vi.fn(),
	readout: {
		ptoDays: 10,
		suggested: 6,
		manual: 0,
		spent: 6,
		remaining: 4,
		hasManualChanges: false,
	},
}));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({ resetManualSelection, setPreviewAlternativeSelection, askForPlan }),
}));

vi.mock("@ui/hooks/usePlanReadout", () => ({ usePlanReadout: () => readout }));

vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number }: { number: number }) => <span>{number}</span>,
}));

const { PlannerPanel } = await import("./PlannerPanel");

beforeEach(() => {
	vi.clearAllMocks();
	Object.assign(readout, { ptoDays: 10, suggested: 6, manual: 0, spent: 6, remaining: 4, hasManualChanges: false });
});

interface SuggestionOfParams {
	effectiveDays: number;
	efficiency: number;
}

const suggestionOf = ({ effectiveDays, efficiency }: SuggestionOfParams) =>
	({
		days: [new Date(2026, 0, 5)],
		bridges: [],
		metrics: { totalEffectiveDays: effectiveDays, averageEfficiency: efficiency, bonusDays: 2 },
	}) as never;

const ALL_SUGGESTIONS = [
	suggestionOf({ effectiveDays: 12, efficiency: 2 }),
	suggestionOf({ effectiveDays: 9, efficiency: 1.8 }),
	suggestionOf({ effectiveDays: 7, efficiency: 1.5 }),
];

const StoreHost = () => {
	const [previewAlternativeIndex, setPreviewIndex] = useState(0);

	return (
		<PlannerPanel
			allSuggestions={ALL_SUGGESTIONS}
			currentSelectionIndex={0}
			selectedIndex={previewAlternativeIndex}
			onSelectionChange={vi.fn()}
			onPreviewChange={(index) => {
				setPreviewAlternativeSelection({ index });
				setPreviewIndex(index);
			}}
		/>
	);
};

const renderPanel = (ui: ReactElement) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			{ui}
		</NextIntlClientProvider>,
	);

const optionReadout = (container: HTMLElement) =>
	container.querySelector('[data-tutorial="alternatives-manager"]')?.textContent ?? "";

describe("PlannerPanel Alternatives", () => {
	it("round-trips the previewed index through the store rather than mirroring it", async () => {
		const { container } = renderPanel(<StoreHost />);

		expect(optionReadout(container)).toContain("Alternative 1 / 3");

		await userEvent.click(screen.getByRole("button", { name: en.alternativesManager.nextSuggestion }));

		expect(setPreviewAlternativeSelection).toHaveBeenCalledWith({ index: 1 });
		expect(optionReadout(container)).toContain("Alternative 2 / 3");

		await userEvent.click(screen.getByRole("button", { name: en.alternativesManager.previousSuggestion }));

		expect(setPreviewAlternativeSelection).toHaveBeenLastCalledWith({ index: 0 });
		expect(optionReadout(container)).toContain("Alternative 1 / 3");
	});

	it("follows selectedIndex on its own, so a store change with no click still moves the readout", () => {
		const props = {
			allSuggestions: ALL_SUGGESTIONS,
			currentSelectionIndex: 0,
			onSelectionChange: vi.fn(),
			onPreviewChange: vi.fn(),
		};

		const { container, rerender } = renderPanel(<PlannerPanel {...props} selectedIndex={0} />);

		expect(optionReadout(container)).toContain("Alternative 1 / 3");

		rerender(
			<NextIntlClientProvider locale="en" messages={en}>
				<PlannerPanel {...props} selectedIndex={2} />
			</NextIntlClientProvider>,
		);

		expect(optionReadout(container)).toContain("Alternative 3 / 3");
	});
});

const panelProps = {
	allSuggestions: ALL_SUGGESTIONS,
	currentSelectionIndex: 0,
	onSelectionChange: vi.fn(),
	onPreviewChange: vi.fn(),
};

describe("PlannerPanel applying an Alternative", () => {
	it("hands over the previewed Suggestion under its own index", async () => {
		const onSelectionChange = vi.fn();
		renderPanel(<PlannerPanel {...panelProps} onSelectionChange={onSelectionChange} selectedIndex={1} />);

		await userEvent.click(screen.getByRole("button", { name: en.alternativesManager.applyAlternative }));

		expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ suggestion: ALL_SUGGESTIONS[1], index: 1 });
	});

	it("says the previewed option is already applied, and offers nothing to press, when it is the current one", () => {
		renderPanel(<PlannerPanel {...panelProps} selectedIndex={0} />);

		const button = screen.getByRole("button", { name: en.alternativesManager.alreadyApplied }) as HTMLButtonElement;

		expect(button.disabled).toBe(true);
	});
});

describe("PlannerPanel comparing an Alternative to the recommended one", () => {
	const srOnly = (container: HTMLElement) =>
		Array.from(container.querySelectorAll(".sr-only")).map((node) => node.textContent);

	it("shows the efficiency gap and the ratio against the first option, which is the recommended one", () => {
		const { container } = renderPanel(<PlannerPanel {...panelProps} selectedIndex={1} />);

		expect(srOnly(container)).toContain("Efficiency: 1.8x (-0.2)");
		expect(srOnly(container)).toContain("Comparison: 90%");
		expect(container.textContent).not.toContain(en.alternativesManager.recommended);
	});

	it("signs a gap in the Alternative's favour with a plus", () => {
		const better = [
			suggestionOf({ effectiveDays: 12, efficiency: 2 }),
			suggestionOf({ effectiveDays: 14, efficiency: 2.4 }),
		];
		const { container } = renderPanel(<PlannerPanel {...panelProps} allSuggestions={better} selectedIndex={1} />);

		expect(srOnly(container)).toContain("Efficiency: 2.4x (+0.4)");
		expect(srOnly(container)).toContain("Comparison: 120%");
	});

	it("greys the ratio out once the Alternative falls more than half a point behind", () => {
		const farBehind = [
			suggestionOf({ effectiveDays: 12, efficiency: 2 }),
			suggestionOf({ effectiveDays: 6, efficiency: 1 }),
		];
		const { container } = renderPanel(<PlannerPanel {...panelProps} allSuggestions={farBehind} selectedIndex={1} />);

		expect(srOnly(container)).toContain("Comparison: 50%");
		expect(container.querySelector(".text-neutral-600.font-semibold")).not.toBeNull();
	});

	it("shows no gap and no ratio on the recommended option itself, only its badge", () => {
		const { container } = renderPanel(<PlannerPanel {...panelProps} selectedIndex={0} />);

		expect(srOnly(container)).toContain("Efficiency: 2.0x");
		expect(srOnly(container).some((text) => text?.startsWith("Comparison"))).toBe(false);
		expect(container.textContent).toContain(en.alternativesManager.recommended);
	});
});

describe("PlannerPanel budget readout", () => {
	const status = (container: HTMLElement) => container.querySelector('[role="status"]')?.textContent ?? "";

	it("says every day is assigned only when none is left and none was hand-edited", () => {
		Object.assign(readout, { spent: 10, remaining: 0, hasManualChanges: false });

		const { container } = renderPanel(<PlannerPanel {...panelProps} selectedIndex={0} />);

		expect(status(container)).toContain(en.ptoStatus.allAssigned);
		expect(container.textContent).toContain("10 / 10 days used · 100%");
		expect(container.textContent).toContain("0 remaining · 0%");
	});

	it("does not call a hand-edited plan fully assigned, even at zero remaining", () => {
		Object.assign(readout, { spent: 10, remaining: 0, manual: 4, suggested: 6, hasManualChanges: true });

		const { container } = renderPanel(<PlannerPanel {...panelProps} selectedIndex={0} />);

		expect(status(container)).not.toContain(en.ptoStatus.allAssigned);
	});

	it("reads nought used when there is no budget at all, rather than dividing by it", () => {
		Object.assign(readout, { ptoDays: 0, suggested: 0, spent: 0, remaining: 0 });

		const { container } = renderPanel(<PlannerPanel {...panelProps} selectedIndex={0} />);

		expect(container.textContent).toContain("0 / 0 days used · 0%");
	});

	it("shows the reset button only once there are manual changes, and resets through the store", async () => {
		const { rerender } = renderPanel(<PlannerPanel {...panelProps} selectedIndex={0} />);
		expect(screen.getByRole("button", { name: en.ptoStatus.resetManual }).className).toContain("invisible");

		Object.assign(readout, { manual: 2, spent: 8, remaining: 2, hasManualChanges: true });
		rerender(
			<NextIntlClientProvider locale="en" messages={en}>
				<PlannerPanel {...panelProps} selectedIndex={0} />
			</NextIntlClientProvider>,
		);
		const reset = screen.getByRole("button", { name: en.ptoStatus.resetManual });
		expect(reset.className).not.toContain("invisible");

		await userEvent.click(reset);

		expect(resetManualSelection).toHaveBeenCalledOnce();
		expect(askForPlan).toHaveBeenCalledOnce();
		expect(track).toHaveBeenCalledExactlyOnceWith({ event: "manual_changes_reset", properties: { surface: "panel" } });
	});
});

describe("PlannerPanel numbers in the reader's own format", () => {
	const NARROW_SPACES = /[\u00A0\u202F]/g;

	it("writes the German readouts with a decimal comma and a spaced percent sign", () => {
		const { container } = render(
			<NextIntlClientProvider locale="de" messages={de}>
				<PlannerPanel {...panelProps} selectedIndex={1} />
			</NextIntlClientProvider>,
		);
		const readouts = Array.from(container.querySelectorAll(".sr-only")).map((node) =>
			(node.textContent ?? "").replace(NARROW_SPACES, " "),
		);

		expect(readouts).toContain("Effizienz: 1,8x (-0,2)");
		expect(readouts).toContain("Vergleich: 90 %");
	});
});

interface RenderInParams {
	locale: Locale;
	messages: object;
	selectedIndex?: number;
}

const renderIn = ({ locale, messages, selectedIndex = 0 }: RenderInParams) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<PlannerPanel {...panelProps} selectedIndex={selectedIndex} />
		</NextIntlClientProvider>,
	);

describe("PlannerPanel budget readout at the plural edges", () => {
	it.each([
		["en", 0, 0, "0 / 0 days used · 0%", en],
		["en", 1, 1, "1 / 1 day used · 100%", en],
		["en", 10, 6, "6 / 10 days used · 60%", en],
		["es", 0, 0, "0 / 0 días usados · 0%", esMessages],
		["es", 1, 1, "1 / 1 día usado · 100%", esMessages],
		["es", 10, 6, "6 / 10 días usados · 60%", esMessages],
	] as const)(
		"writes the %s budget of %i with %i used as one sentence",
		(locale, ptoDays, spent, expected, messages) => {
			Object.assign(readout, { ptoDays, spent, suggested: spent, remaining: ptoDays - spent });

			const { container } = renderIn({ locale, messages });

			expect(container.textContent).toContain(expected);
		},
	);
});

describe("PlannerPanel readouts as whole sentences", () => {
	const srOnly = (container: HTMLElement) =>
		Array.from(container.querySelectorAll(".sr-only")).map((node) => node.textContent);

	it("lets French put its space before the colon, which a colon glued on by the component could not", () => {
		const { container } = renderIn({ locale: "fr", messages: frMessages });

		expect(srOnly(container)).toEqual(expect.arrayContaining(["Suggérés : 6", "Manuel : 0", "Restants : 4"]));
		expect(container.textContent).toContain("Suggérés :");
	});

	it("reads the Alternative's position and readouts for a screen reader in plain words", () => {
		const { container } = renderIn({ locale: "en", messages: en, selectedIndex: 1 });

		expect(srOnly(container)).toEqual(
			expect.arrayContaining([
				"Alternative 2 / 3",
				"Total effective days: 9 (+2)",
				"Efficiency: 1.8x (-0.2)",
				"Comparison: 90%",
				"Suggested: 6",
				"Manual: 0",
				"Remaining: 4",
			]),
		);
	});

	it.each([
		["en", en, "Alternative 2 / 3"],
		["es", esMessages, "Alternativa 2 / 3"],
		["ca", caMessages, "Alternativa 2 / 3"],
		["it", itMessages, "Alternativa 2 / 3"],
		["de", de, "Alternative 2 / 3"],
		["fr", frMessages, "Alternative 2 / 3"],
	] as const)(
		"renders the %s position and budget sentences whole, with no raw tag, brace or key",
		(locale, messages, position) => {
			const { container } = renderIn({ locale, messages, selectedIndex: 1 });

			expect(srOnly(container)).toContain(position);
			expect(container.textContent).toContain(position);
			expect(container.textContent).not.toMatch(/[<>{}]|alternativesManager\.|ptoStatus\./);
		},
	);
});
