import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHasOpened } from "./useHasOpened";

describe("useHasOpened", () => {
	it("answers false while the thing has never opened", () => {
		const { result } = renderHook(() => useHasOpened(false));

		expect(result.current).toBe(false);
	});

	it("answers true from the render that opens it", () => {
		const { result, rerender } = renderHook(({ open }) => useHasOpened(open), { initialProps: { open: false } });

		rerender({ open: true });

		expect(result.current).toBe(true);
	});

	it("keeps answering true once closed again, so a close can animate and a reopen costs no fetch", () => {
		const { result, rerender } = renderHook(({ open }) => useHasOpened(open), { initialProps: { open: true } });

		rerender({ open: false });

		expect(result.current).toBe(true);
	});
});
