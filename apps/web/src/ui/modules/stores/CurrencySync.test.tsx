import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurrencySync } from "./CurrencySync";

const { mockGetCurrencyFromLocale, mockUseLocale } = vi.hoisted(() => ({
	mockGetCurrencyFromLocale: vi.fn(),
	mockUseLocale: vi.fn(),
}));

vi.mock("next-intl", () => ({ useLocale: mockUseLocale }));
vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: { getCurrencyFromLocale: () => void }) => unknown) =>
		selector({ getCurrencyFromLocale: mockGetCurrencyFromLocale }),
}));

beforeEach(() => {
	vi.clearAllMocks();
	mockUseLocale.mockReturnValue("de");
});

describe("CurrencySync", () => {
	it("seeds the currency from the active locale on mount", () => {
		render(<CurrencySync />);
		expect(mockGetCurrencyFromLocale).toHaveBeenCalledWith("de");
	});

	it("renders nothing, so it can sit anywhere in the tree", () => {
		const { container } = render(<CurrencySync />);
		expect(container.innerHTML).toBe("");
	});

	it("re-seeds when the locale changes", () => {
		const { rerender } = render(<CurrencySync />);
		mockUseLocale.mockReturnValue("es");
		rerender(<CurrencySync />);
		expect(mockGetCurrencyFromLocale).toHaveBeenNthCalledWith(2, "es");
	});
});
