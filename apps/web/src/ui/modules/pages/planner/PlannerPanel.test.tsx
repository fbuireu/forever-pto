import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

const { setPreviewAlternativeSelection } = vi.hoisted(() => ({ setPreviewAlternativeSelection: vi.fn() }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({ resetManualSelection: vi.fn(), setPreviewAlternativeSelection }),
}));

vi.mock("@ui/hooks/usePlanReadout", () => ({
	usePlanReadout: () => ({
		ptoDays: 10,
		suggested: 6,
		manual: 0,
		spent: 6,
		remaining: 4,
		hasManualChanges: false,
	}),
}));

vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number }: { number: number }) => <span>{number}</span>,
}));

const { PlannerPanel } = await import("./PlannerPanel");

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
				setPreviewAlternativeSelection({ suggestion: null, index });
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

		expect(optionReadout(container)).toContain(`${en.alternativesManager.option}1/ 3`);

		await userEvent.click(screen.getByRole("button", { name: en.alternativesManager.nextSuggestion }));

		expect(setPreviewAlternativeSelection).toHaveBeenCalledWith({ suggestion: null, index: 1 });
		expect(optionReadout(container)).toContain(`${en.alternativesManager.option}2/ 3`);

		await userEvent.click(screen.getByRole("button", { name: en.alternativesManager.previousSuggestion }));

		expect(setPreviewAlternativeSelection).toHaveBeenLastCalledWith({ suggestion: null, index: 0 });
		expect(optionReadout(container)).toContain(`${en.alternativesManager.option}1/ 3`);
	});

	it("follows selectedIndex on its own, so a store change with no click still moves the readout", () => {
		const props = {
			allSuggestions: ALL_SUGGESTIONS,
			currentSelectionIndex: 0,
			onSelectionChange: vi.fn(),
			onPreviewChange: vi.fn(),
		};

		const { container, rerender } = renderPanel(<PlannerPanel {...props} selectedIndex={0} />);

		expect(optionReadout(container)).toContain(`${en.alternativesManager.option}1/ 3`);

		rerender(
			<NextIntlClientProvider locale="en" messages={en}>
				<PlannerPanel {...props} selectedIndex={2} />
			</NextIntlClientProvider>,
		);

		expect(optionReadout(container)).toContain(`${en.alternativesManager.option}3/ 3`);
	});
});
