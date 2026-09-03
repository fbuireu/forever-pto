import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../../i18n/messages/en.json";

const {
	filtersState,
	mockResetFilters,
	mockResetHolidays,
	mockFetchHolidays,
	mockGenerateSuggestions,
	mockToast,
	mockLogClientError,
} = vi.hoisted(() => ({
	filtersState: {
		country: "",
		region: "",
		year: 2026,
		carryOverMonths: 1,
		ptoDays: 22,
		allowPastDays: false,
		strategy: "grouped",
	},
	mockResetFilters: vi.fn(),
	mockResetHolidays: vi.fn(),
	mockFetchHolidays: vi.fn().mockResolvedValue(undefined),
	mockGenerateSuggestions: vi.fn().mockResolvedValue(undefined),
	mockToast: { success: vi.fn(), error: vi.fn() },
	mockLogClientError: vi.fn(),
}));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: Object.assign(
		(selector: (state: unknown) => unknown) => selector({ ...filtersState, resetToDefaults: mockResetFilters }),
		{ getState: () => ({ ...filtersState, resetToDefaults: mockResetFilters }) },
	),
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) =>
		selector({
			resetToDefaults: mockResetHolidays,
			fetchHolidays: mockFetchHolidays,
			generateSuggestions: mockGenerateSuggestions,
		}),
}));

vi.mock("sonner", () => ({ toast: mockToast }));
vi.mock("@application/shared/utils/clientLog", () => ({ logClientError: mockLogClientError }));

const { Troubleshooting } = await import("./Troubleshooting");

const renderComponent = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<Troubleshooting />
		</NextIntlClientProvider>,
	);

const clickReset = async () => {
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: en.troubleshooting.resetButton }));
};

beforeEach(() => {
	vi.clearAllMocks();
	filtersState.country = "";
});

describe("Troubleshooting", () => {
	it("clears the filters store too, because the copy promises everything goes back to defaults", async () => {
		renderComponent();
		await clickReset();

		await waitFor(() => expect(mockResetFilters).toHaveBeenCalled());
		expect(mockResetHolidays).toHaveBeenCalled();
	});

	it("does not re-fetch against the empty default country, which would plan a year with no holidays", async () => {
		renderComponent();
		await clickReset();

		await waitFor(() => expect(mockResetFilters).toHaveBeenCalled());
		expect(mockFetchHolidays).not.toHaveBeenCalled();
		expect(mockGenerateSuggestions).not.toHaveBeenCalled();
	});

	it("rebuilds the plan from the values left after the reset, never the ones held before it", async () => {
		filtersState.country = "ES";
		renderComponent();
		await clickReset();

		await waitFor(() => expect(mockFetchHolidays).toHaveBeenCalled());
		expect(mockFetchHolidays).toHaveBeenCalledWith(expect.objectContaining({ country: "ES", year: 2026 }));
		expect(mockGenerateSuggestions).toHaveBeenCalledWith(expect.objectContaining({ ptoDays: 22, year: 2026 }));
	});

	it("reports success once the reset completes", async () => {
		renderComponent();
		await clickReset();

		await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
	});

	it("tells the user the reset failed, leaves a record, and keeps the button available for another try", async () => {
		mockResetHolidays.mockImplementationOnce(() => {
			throw new Error("storage quota");
		});
		renderComponent();
		await clickReset();

		await waitFor(() =>
			expect(mockToast.error).toHaveBeenCalledWith(en.troubleshooting.errorTitle, {
				description: en.troubleshooting.errorDescription,
			}),
		);
		expect(mockLogClientError).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ context: { component: "Troubleshooting" } }),
		);
		expect(mockToast.success).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: en.troubleshooting.resetButton })).toHaveProperty("disabled", false);
	});
});
