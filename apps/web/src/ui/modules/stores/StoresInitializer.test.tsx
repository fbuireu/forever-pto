import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({ country: "", setCountry: vi.fn() }));

const ready = vi.hoisted(() => ({ value: true }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(filters),
}));

vi.mock("@ui/hooks/useStoresReady", () => ({
	useStoresReady: () => ({ areStoresReady: ready.value }),
}));

const { StoresInitializer } = await import("./StoresInitializer");

const withCookie = (value: string) => vi.spyOn(document, "cookie", "get").mockReturnValue(value);

beforeEach(() => {
	filters.country = "";
	filters.setCountry.mockClear();
	ready.value = true;
	withCookie("");
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("StoresInitializer", () => {
	it("renders nothing: it exists for its effect", () => {
		const { container } = render(<StoresInitializer />);

		expect(container.innerHTML).toBe("");
	});

	it("seeds the country the edge detected", () => {
		withCookie("user-country=ES");

		render(<StoresInitializer />);

		expect(filters.setCountry).toHaveBeenCalledExactlyOnceWith("ES");
	});

	it("finds the cookie among the others rather than only as the first one", () => {
		withCookie("sidebar_state=true; user-country=FR; NEXT_LOCALE=fr");

		render(<StoresInitializer />);

		expect(filters.setCountry).toHaveBeenCalledExactlyOnceWith("FR");
	});

	it("does not mistake another cookie whose name ends the same way", () => {
		withCookie("preferred-user-country=ES");

		render(<StoresInitializer />);

		expect(filters.setCountry).not.toHaveBeenCalled();
	});

	it("waits for the stores to rehydrate, so it cannot seed over what was persisted", () => {
		ready.value = false;
		withCookie("user-country=ES");

		render(<StoresInitializer />);

		expect(filters.setCountry).not.toHaveBeenCalled();
	});

	it("leaves a country the visitor already chose alone", () => {
		filters.country = "IT";
		withCookie("user-country=ES");

		render(<StoresInitializer />);

		expect(filters.setCountry).not.toHaveBeenCalled();
	});

	it("stays quiet when the edge detected nothing", () => {
		render(<StoresInitializer />);

		expect(filters.setCountry).not.toHaveBeenCalled();
	});
});
