import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const filtersState = { year: 2027 };

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

describe("SiteTitleYear", () => {
	it("shows the year the filters hold, so the heading follows the sidebar rather than the clock", () => {
		const { getByTestId } = render(<SiteTitleYear />);

		expect(getByTestId("year").textContent).toBe("2027");
	});

	it("moves with the filters without a remount", () => {
		const { getByTestId, rerender } = render(<SiteTitleYear />);

		filtersState.year = 2028;
		rerender(<SiteTitleYear />);

		expect(getByTestId("year").textContent).toBe("2028");
		filtersState.year = 2027;
	});

	it("sets the year in the serif face the title pairs with the display face", () => {
		const { getByTestId } = render(<SiteTitleYear />);

		expect(getByTestId("year").className).toContain("font-serif");
	});
});
