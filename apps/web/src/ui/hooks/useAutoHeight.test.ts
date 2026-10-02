import { act, render, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoHeight } from "./useAutoHeight";

const disconnect = vi.fn();
const observe = vi.fn();
const resizeCallbacks: (() => void)[] = [];
const attached: HTMLElement[] = [];

function MockResizeObserver(this: object, cb: () => void) {
	Object.assign(this, { observe, disconnect, _cb: cb });
	resizeCallbacks.push(cb);
}

beforeEach(() => {
	vi.clearAllMocks();
	resizeCallbacks.length = 0;
	vi.stubGlobal("ResizeObserver", MockResizeObserver);

	vi.stubGlobal(
		"getComputedStyle",
		vi.fn(() => ({
			paddingTop: "0px",
			paddingBottom: "0px",
			borderTopWidth: "0px",
			borderBottomWidth: "0px",
			boxSizing: "content-box",
		})),
	);
});

afterEach(() => {
	for (const el of attached.splice(0)) el.remove();
	vi.unstubAllGlobals();
});

interface AttachRefParams {
	result: { ref: RefObject<HTMLElement | null> };
	rectHeight?: number;
}

const attachRef = ({ result, rectHeight = 0 }: AttachRefParams) => {
	const el = document.createElement("div");
	document.body.appendChild(el);
	attached.push(el);
	el.getBoundingClientRect = () => ({ height: rectHeight }) as DOMRect;
	result.ref.current = el;
	return el;
};

const stubBox = (boxSizing: string) => {
	vi.stubGlobal(
		"getComputedStyle",
		vi.fn(() => ({
			paddingTop: "10px",
			paddingBottom: "10px",
			borderTopWidth: "2px",
			borderBottomWidth: "2px",
			boxSizing,
		})),
	);
};

describe("useAutoHeight", () => {
	it("returns a ref and an initial height of 0", () => {
		const { result } = renderHook(() => useAutoHeight());
		expect(result.current.ref).toBeDefined();
		expect(result.current.height).toBe(0);
	});

	it("creates a ResizeObserver once a DOM element is attached", () => {
		let deps = [1];
		const { result, rerender } = renderHook(() => useAutoHeight(deps));

		const el = attachRef({ result: result.current });

		act(() => {
			deps = [2];
			rerender();
		});

		expect(observe).toHaveBeenCalledWith(el);
	});

	it("disconnects the ResizeObserver on unmount", () => {
		let deps = [1];
		const { result, rerender, unmount } = renderHook(() => useAutoHeight(deps));

		attachRef({ result: result.current });

		act(() => {
			deps = [2];
			rerender();
		});

		unmount();
		expect(disconnect).toHaveBeenCalled();
	});

	it("re-creates the observer when deps change", () => {
		let deps = [1];
		const { result, rerender } = renderHook(() => useAutoHeight(deps));

		attachRef({ result: result.current });

		act(() => {
			deps = [2];
			rerender();
		});
		const firstCount = observe.mock.calls.length;

		act(() => {
			deps = [3];
			rerender();
		});

		expect(observe.mock.calls.length).toBeGreaterThan(firstCount);
	});

	it("reports the element rect height plus the parent border-box padding and border", () => {
		stubBox("border-box");
		let deps = [1];
		const { result, rerender } = renderHook(() => useAutoHeight(deps));

		attachRef({ result: result.current, rectHeight: 50 });

		act(() => {
			deps = [2];
			rerender();
		});

		expect(result.current.height).toBe(74);
	});

	it("adds nothing for a content-box parent", () => {
		stubBox("content-box");
		let deps = [1];
		const { result, rerender } = renderHook(() => useAutoHeight(deps));

		attachRef({ result: result.current, rectHeight: 50 });

		act(() => {
			deps = [2];
			rerender();
		});

		expect(result.current.height).toBe(50);
	});

	it("rounds the total up to a whole device pixel", () => {
		stubBox("content-box");
		vi.stubGlobal("devicePixelRatio", 3);
		let deps = [1];
		const { result, rerender } = renderHook(() => useAutoHeight(deps));

		attachRef({ result: result.current, rectHeight: 50.1 });

		act(() => {
			deps = [2];
			rerender();
		});

		expect(result.current.height).toBeCloseTo(151 / 3, 5);
	});

	it("retries the measurement at mount when the first reading is zero", () => {
		stubBox("content-box");
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
			.mockReturnValueOnce({ height: 0 } as DOMRect)
			.mockReturnValue({ height: 50 } as DOMRect);
		const heights: number[] = [];
		const Probe = () => {
			const { ref, height } = useAutoHeight();
			heights.push(height);
			return createElement("div", { ref });
		};

		try {
			render(createElement(Probe));
		} finally {
			vi.restoreAllMocks();
		}

		expect(heights.at(-1)).toBe(50);
	});

	it("does not re-measure on a later render whose deps did not change", () => {
		stubBox("border-box");
		const { result, rerender } = renderHook(() => useAutoHeight([1]));

		attachRef({ result: result.current, rectHeight: 50 });
		expect(result.current.height).toBe(0);

		act(() => {
			rerender();
		});

		expect(result.current.height).toBe(0);
	});
});

describe("useAutoHeight's animation frame", () => {
	const pending = new Map<number, FrameRequestCallback>();
	let nextHandle = 0;

	beforeEach(() => {
		pending.clear();
		vi.stubGlobal(
			"requestAnimationFrame",
			vi.fn((callback: FrameRequestCallback) => {
				nextHandle += 1;
				pending.set(nextHandle, callback);
				return nextHandle;
			}),
		);
		vi.stubGlobal(
			"cancelAnimationFrame",
			vi.fn((handle: number) => {
				pending.delete(handle);
			}),
		);
	});

	const observeResizes = () => {
		let deps = [1];
		const hook = renderHook(() => useAutoHeight(deps));
		attachRef({ result: hook.result.current, rectHeight: 50 });

		act(() => {
			deps = [2];
			hook.rerender();
		});

		const resize = resizeCallbacks.at(-1);
		if (!resize) throw new Error("no ResizeObserver was created");
		return { ...hook, resize };
	};

	it("cancels the frame a resize scheduled when the component unmounts before it runs", () => {
		const { resize, unmount } = observeResizes();

		resize();
		unmount();

		expect(pending.size).toBe(0);
	});

	it("keeps one frame in flight, replacing the one a previous resize left pending", () => {
		const { resize, unmount } = observeResizes();

		resize();
		resize();

		expect(pending.size).toBe(1);
		unmount();
	});
});
