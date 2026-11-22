import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useIsMobile } from "./useMobile";

interface MediaQueryListDouble {
	matches: boolean;
	addEventListener: Mock;
	removeEventListener: Mock;
}

const makeMediaQueryList = (matches: boolean): MediaQueryListDouble => ({
	matches,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
});

beforeEach(() => {
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => makeMediaQueryList(query.includes("max-width: 1023px"))),
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useIsMobile", () => {
	it("returns false when viewport is wider than breakpoint", () => {
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => makeMediaQueryList(false)),
		);
		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(false);
	});

	it("returns true when viewport is narrower than breakpoint", () => {
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => makeMediaQueryList(true)),
		);
		const { result } = renderHook(() => useIsMobile());
		expect(result.current).toBe(true);
	});

	it("answers true below lg, the width the sidebar's lg classes start drawing the rail at", () => {
		const matchMedia = vi.fn((query: string) => makeMediaQueryList(query === "(max-width: 1023px)"));
		vi.stubGlobal("matchMedia", matchMedia);

		const { result } = renderHook(() => useIsMobile());

		expect(matchMedia).toHaveBeenCalledWith("(max-width: 1023px)");
		expect(result.current).toBe(true);
	});

	it("subscribes to media query change events", () => {
		const mql = makeMediaQueryList(false);
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => mql),
		);

		renderHook(() => useIsMobile());

		expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
	});

	it("unsubscribes on unmount", () => {
		const mql = makeMediaQueryList(false);
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => mql),
		);

		const { unmount } = renderHook(() => useIsMobile());
		unmount();

		expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
	});
});
