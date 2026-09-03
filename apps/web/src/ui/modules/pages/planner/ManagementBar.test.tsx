import deMessages from "@i18n/messages/de.json";
import esMessages from "@i18n/messages/es.json";
import { act, fireEvent, render } from "@testing-library/react";
import { TUTORIAL_EVENT } from "@ui/modules/tutorial/anchors";
import { type Locale, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));

interface PanelMockProps {
	allSuggestions: unknown[];
	onPreviewChange: (index: number) => void;
	onSelectionChange: (params: { suggestion: unknown; index: number }) => void;
}

interface DrawerMockProps {
	children: ReactNode;
	snapPoints: number[];
	activeSnapPoint: number | string | null;
}

const holidaysState = {
	alternatives: [],
	suggestion: null,
	currentSelection: null,
	setPreviewAlternativeSelection: vi.fn(),
	setCurrentAlternativeSelection: vi.fn(),
	previewAlternativeIndex: 0,
	currentSelectionIndex: 0,
};

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: typeof holidaysState) => unknown) => selector(holidaysState),
}));
vi.mock("@ui/hooks/useMobile", () => ({ useIsMobile: () => true }));
const readyState = { areStoresReady: false };
vi.mock("@ui/hooks/useStoresReady", () => ({ useStoresReady: () => readyState }));
vi.mock("@ui/modules/core/animate/base/Sidebar", () => ({ useSidebar: () => ({ openMobile: false }) }));
vi.mock("@ui/modules/core/animate/base/Drawer", () => ({
	Drawer: ({ children, snapPoints, activeSnapPoint }: DrawerMockProps) => (
		<div data-testid="drawer" data-snap-points={JSON.stringify(snapPoints)} data-active-snap={String(activeSnapPoint)}>
			{children}
		</div>
	),
	DrawerContent: ({ children, overlay: _overlay, ...rest }: { children: ReactNode; overlay?: boolean }) => (
		<div {...rest}>{children}</div>
	),
	DrawerTitle: ({ children }: { children: ReactNode }) => <h2 data-testid="drawer-title">{children}</h2>,
}));
vi.mock("boneyard-js/react", () => ({ Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("sonner", () => ({ toast: { success: toastSuccess } }));
vi.mock("./Legend", () => ({ LegendItems: () => null }));
vi.mock("./PlannerPanel", () => ({
	PlannerPanel: ({ allSuggestions, onPreviewChange, onSelectionChange }: PanelMockProps) => (
		<div>
			<button type="button" onClick={() => onPreviewChange(1)}>
				preview next
			</button>
			<button type="button" onClick={() => onSelectionChange({ suggestion: allSuggestions[1], index: 1 })}>
				apply
			</button>
		</div>
	),
}));
vi.mock("./PlannerPanelFixture", () => ({ PlannerPanelFixture: () => null }));

import { DRAWER_SNAP, ManagementBar } from "./ManagementBar";

interface RenderBarParams {
	locale: Locale;
	messages: object;
}

const renderBar = ({ locale, messages }: RenderBarParams) =>
	render(
		<NextIntlClientProvider locale={locale} messages={messages}>
			<ManagementBar />
		</NextIntlClientProvider>,
	);

describe("ManagementBar mobile drawer", () => {
	it("announces the localised planner heading in German", () => {
		const { getByTestId } = renderBar({ locale: "de", messages: deMessages });
		expect(getByTestId("drawer-title").textContent).toBe(deMessages.planner.heading);
	});

	it("announces the localised planner heading in Spanish", () => {
		const { getByTestId } = renderBar({ locale: "es", messages: esMessages });
		expect(getByTestId("drawer-title").textContent).toBe("Planificador");
	});
});

describe("ManagementBar empty plan", () => {
	it("stops pretending to load once the engine has settled on no plan at all", () => {
		readyState.areStoresReady = true;
		holidaysState.suggestion = null;
		holidaysState.currentSelection = null;
		holidaysState.alternatives = [];
		(holidaysState as { isCalculating?: boolean; hasCalculated?: boolean }).isCalculating = false;
		(holidaysState as { hasCalculated?: boolean }).hasCalculated = true;

		const { container } = renderBar({ locale: "es", messages: esMessages });

		expect(container.querySelector('[data-tutorial="planner-drawer"]')).toBeNull();
		expect(container.textContent).not.toContain(esMessages.planner.heading);

		readyState.areStoresReady = false;
		(holidaysState as { hasCalculated?: boolean }).hasCalculated = false;
	});

	it("says so out loud, so a finished-and-empty run is not a broken page", () => {
		readyState.areStoresReady = true;
		holidaysState.suggestion = null;
		holidaysState.currentSelection = null;
		holidaysState.alternatives = [];
		(holidaysState as { isCalculating?: boolean }).isCalculating = false;
		(holidaysState as { hasCalculated?: boolean }).hasCalculated = true;

		const { container } = renderBar({ locale: "es", messages: esMessages });

		expect(container.querySelector('[role="status"]')?.textContent).toBe(esMessages.a11y.noPlan);

		readyState.areStoresReady = false;
		(holidaysState as { hasCalculated?: boolean }).hasCalculated = false;
	});

	it("stays quiet while there is still a plan on the page", () => {
		readyState.areStoresReady = true;
		(holidaysState as { hasCalculated?: boolean }).hasCalculated = false;

		const { container } = renderBar({ locale: "es", messages: esMessages });

		expect(container.querySelector('[role="status"]')?.textContent).toBe("");

		readyState.areStoresReady = false;
	});

	it("keeps the panel on a cold load, before any calculation has ever completed", () => {
		readyState.areStoresReady = true;
		holidaysState.suggestion = null;
		holidaysState.currentSelection = null;
		(holidaysState as { isCalculating?: boolean; hasCalculated?: boolean }).isCalculating = false;
		(holidaysState as { hasCalculated?: boolean }).hasCalculated = false;

		const { container } = renderBar({ locale: "es", messages: esMessages });

		expect(container.textContent).toContain(esMessages.planner.heading);

		readyState.areStoresReady = false;
	});

	it("still shows the skeleton while a calculation is genuinely in flight", () => {
		readyState.areStoresReady = true;
		holidaysState.suggestion = null;
		holidaysState.currentSelection = null;
		(holidaysState as { isCalculating?: boolean }).isCalculating = true;

		const { container } = renderBar({ locale: "es", messages: esMessages });

		expect(container.textContent).toContain(esMessages.planner.heading);

		readyState.areStoresReady = false;
		(holidaysState as { isCalculating?: boolean }).isCalculating = false;
	});
});

describe("ManagementBar drawer header", () => {
	interface MakeSuggestionParams {
		effectiveDays: number;
		efficiency: number;
	}

	const makeSuggestion = ({ effectiveDays, efficiency }: MakeSuggestionParams) => ({
		days: [new Date(2026, 0, 5)],
		bridges: [],
		metrics: { totalEffectiveDays: effectiveDays, averageEfficiency: efficiency },
	});

	const applied = makeSuggestion({ effectiveDays: 4, efficiency: 2 });
	const previewed = makeSuggestion({ effectiveDays: 9, efficiency: 4.5 });

	it("numbers the option the metrics beside it belong to, not the applied one", () => {
		readyState.areStoresReady = true;
		holidaysState.suggestion = applied as never;
		holidaysState.currentSelection = applied as never;
		holidaysState.alternatives = [previewed] as never;
		holidaysState.currentSelectionIndex = 0;
		holidaysState.previewAlternativeIndex = 1;

		const { container } = renderBar({ locale: "es", messages: esMessages });
		const text = container.textContent ?? "";

		expect(text).toContain(`${esMessages.alternativesManager.option} 2`);
		expect(text).toContain("9");
		expect(text).toContain("4.5x");

		readyState.areStoresReady = false;
		holidaysState.suggestion = null;
		holidaysState.currentSelection = null;
		holidaysState.alternatives = [];
		holidaysState.previewAlternativeIndex = 0;
	});
});

describe("ManagementBar drawer extent", () => {
	it("never expands to the whole viewport, so there is always page left to touch", () => {
		const { getByTestId } = renderBar({ locale: "es", messages: esMessages });
		const points: number[] = JSON.parse(getByTestId("drawer").getAttribute("data-snap-points") ?? "[]");

		expect(points.length).toBeGreaterThan(0);
		expect(Math.max(...points)).toBeLessThan(1);
	});

	it("opens at the collapsed snap point rather than the expanded one", () => {
		const { getByTestId } = renderBar({ locale: "es", messages: esMessages });

		expect(getByTestId("drawer").getAttribute("data-active-snap")).toBe(String(DRAWER_SNAP.COLLAPSED));
	});

	it("expands when the tutorial asks and comes back down when the tour ends", () => {
		const { getByTestId } = renderBar({ locale: "es", messages: esMessages });

		act(() => {
			globalThis.dispatchEvent(new CustomEvent(TUTORIAL_EVENT.EXPAND_DRAWER));
		});
		expect(getByTestId("drawer").getAttribute("data-active-snap")).toBe(String(DRAWER_SNAP.EXPANDED));

		act(() => {
			globalThis.dispatchEvent(new CustomEvent(TUTORIAL_EVENT.COLLAPSE_DRAWER));
		});
		expect(getByTestId("drawer").getAttribute("data-active-snap")).toBe(String(DRAWER_SNAP.COLLAPSED));
	});
});

describe("ManagementBar drawer role", () => {
	it("is a region, not a dialog: it is always open, cannot be dismissed and has no close button", () => {
		const { container } = renderBar({ locale: "es", messages: esMessages });

		expect(container.querySelector('[role="region"]')).not.toBeNull();
		expect(container.querySelector('[role="dialog"]')).toBeNull();
	});
});

describe("ManagementBar hands the panel's choices to the store", () => {
	const plan = (effectiveDays: number) => ({
		days: [new Date(2026, 0, 5)],
		bridges: [],
		metrics: { totalEffectiveDays: effectiveDays, averageEfficiency: 2 },
	});

	const ready = () => {
		readyState.areStoresReady = true;
		holidaysState.suggestion = plan(4) as never;
		holidaysState.currentSelection = plan(4) as never;
		holidaysState.alternatives = [plan(9)] as never;
		holidaysState.setPreviewAlternativeSelection.mockClear();
		holidaysState.setCurrentAlternativeSelection.mockClear();
		toastSuccess.mockClear();
	};

	const settle = () => {
		readyState.areStoresReady = false;
		holidaysState.suggestion = null;
		holidaysState.currentSelection = null;
		holidaysState.alternatives = [];
	};

	it("previews the Alternative the panel asks for", () => {
		ready();
		const { getByRole } = renderBar({ locale: "es", messages: esMessages });

		fireEvent.click(getByRole("button", { name: "preview next" }));

		expect(holidaysState.setPreviewAlternativeSelection).toHaveBeenCalledExactlyOnceWith({ index: 1 });
		settle();
	});

	it("applies it, says so, and pulls the drawer back down to the collapsed snap", () => {
		ready();
		const { getByRole, getByTestId } = renderBar({ locale: "es", messages: esMessages });
		act(() => {
			globalThis.dispatchEvent(new CustomEvent(TUTORIAL_EVENT.EXPAND_DRAWER));
		});
		expect(getByTestId("drawer").getAttribute("data-active-snap")).toBe(String(DRAWER_SNAP.EXPANDED));

		fireEvent.click(getByRole("button", { name: "apply" }));

		expect(holidaysState.setCurrentAlternativeSelection).toHaveBeenCalledExactlyOnceWith({
			suggestion: holidaysState.alternatives[0],
			index: 1,
		});
		expect(toastSuccess).toHaveBeenCalledExactlyOnceWith(esMessages.toasts.suggestionApplied);
		expect(getByTestId("drawer").getAttribute("data-active-snap")).toBe(String(DRAWER_SNAP.COLLAPSED));
		settle();
	});

	it("waits for an applied selection, not merely a Suggestion, before it shows the panel", () => {
		ready();
		holidaysState.currentSelection = null;

		const { queryByRole } = renderBar({ locale: "es", messages: esMessages });

		expect(queryByRole("button", { name: "apply" })).toBeNull();
		settle();
	});

	it("treats a plan with no days as not ready, so the panel is never handed an empty Suggestion", () => {
		ready();
		holidaysState.suggestion = { ...plan(0), days: [] } as never;
		holidaysState.currentSelection = { ...plan(0), days: [] } as never;

		const { queryByRole, container } = renderBar({ locale: "es", messages: esMessages });

		expect(queryByRole("button", { name: "apply" })).toBeNull();
		expect(container.textContent).not.toContain(esMessages.alternativesManager.option);
		settle();
	});
});
