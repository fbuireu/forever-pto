import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const premiumState = vi.hoisted(() => ({
	premiumKey: null as string | null,
	showPremiumModal: vi.fn(),
	checkExistingSession: vi.fn(),
}));

vi.mock("@application/stores/premium", () => ({
	usePremiumStore: (selector: (state: typeof premiumState) => unknown) => selector(premiumState),
}));

const { usePremiumGate } = await import("./usePremiumGate");

const GATE = { feature: "customHolidays", origin: "planner" } as const;

beforeEach(() => {
	premiumState.premiumKey = null;
	premiumState.showPremiumModal.mockClear();
	premiumState.checkExistingSession.mockClear();
});

describe("usePremiumGate", () => {
	it("is locked until the store holds a Premium key", () => {
		expect(renderHook(() => usePremiumGate(GATE)).result.current.isLocked).toBe(true);

		premiumState.premiumKey = "key";

		expect(renderHook(() => usePremiumGate(GATE)).result.current.isLocked).toBe(false);
	});

	it("opens the Premium modal for the feature and origin it was given", () => {
		const { result } = renderHook(() => usePremiumGate(GATE));

		result.current.unlock();

		expect(premiumState.showPremiumModal).toHaveBeenCalledExactlyOnceWith(GATE);
	});

	it("asks the store to confirm an existing session once, on mount", () => {
		const { rerender } = renderHook(() => usePremiumGate(GATE));
		rerender();

		expect(premiumState.checkExistingSession).toHaveBeenCalledOnce();
	});
});
