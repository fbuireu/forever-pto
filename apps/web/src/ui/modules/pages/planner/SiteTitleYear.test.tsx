import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const filtersState = { year: 2027 };
const stores = vi.hoisted(() => ({ ready: true }));

vi.mock("@ui/hooks/useStoresReady", () => ({ useStoresReady: () => ({ areStoresReady: stores.ready }) }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: typeof filtersState) => unknown) => selector(filtersState),
}));
vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number, className }: { number: number; className?: string }) => (
		<span data-testid="year" className={className}>
			{number}
		</span>
	),
}));

import { SiteTitleYear } from "./SiteTitleYear";

afterEach(() => {
	filtersState.year = 2027;
	stores.ready = true;
});

describe("SiteTitleYear", () => {
	it("shows the year the server rendered with until the stores are ready, so the first pass matches the HTML", () => {
		stores.ready = false;

		const { getByTestId } = render(<SiteTitleYear serverYear={2026} />);

		expect(getByTestId("year").textContent).toBe("2026");
	});

	it("then shows the year the filters hold, so the heading follows the sidebar rather than the clock", () => {
		const { getByTestId } = render(<SiteTitleYear serverYear={2026} />);

		expect(getByTestId("year").textContent).toBe("2027");
	});

	it("moves with the filters without a remount", () => {
		const { getByTestId, rerender } = render(<SiteTitleYear serverYear={2026} />);

		filtersState.year = 2028;
		rerender(<SiteTitleYear serverYear={2026} />);

		expect(getByTestId("year").textContent).toBe("2028");
	});

	it("sets the year in the serif face the title pairs with the display face", () => {
		const { getByTestId } = render(<SiteTitleYear serverYear={2026} />);

		expect(getByTestId("year").className).toContain("font-serif");
	});
});
