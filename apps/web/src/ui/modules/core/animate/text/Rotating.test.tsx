import { act, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MotionDivProps = ComponentProps<"div"> & {
	initial?: { y?: number };
	animate?: unknown;
	exit?: { y?: number };
	transition?: unknown;
};

vi.mock("motion/react", async () => {
	const { createElement, Fragment } = await import("react");
	return {
		m: {
			div: ({ children, initial, animate: _a, exit, transition: _t, ...props }: MotionDivProps) =>
				createElement(
					"div",
					{ "data-enter-y": String(initial?.y), "data-exit-y": String(exit?.y), ...props },
					children,
				),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

import { RotatingText } from "./Rotating";

const WORDS = ["plan", "bridge", "rest"];

const word = () => screen.getByTestId("rotating");

const advance = (ms: number) => {
	act(() => {
		vi.advanceTimersByTime(ms);
	});
};

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("RotatingText", () => {
	it("shows a single string as it is and starts no clock for it", () => {
		render(<RotatingText text="plan" data-testid="rotating" />);

		expect(word().textContent).toBe("plan");
		expect(vi.getTimerCount()).toBe(0);
	});

	it("steps through the list every two seconds by default and wraps round", () => {
		render(<RotatingText text={WORDS} data-testid="rotating" />);
		expect(word().textContent).toBe("plan");

		advance(2000);
		expect(word().textContent).toBe("bridge");

		advance(2000);
		expect(word().textContent).toBe("rest");

		advance(2000);
		expect(word().textContent).toBe("plan");
	});

	it("takes its pace from duration", () => {
		render(<RotatingText text={WORDS} duration={500} data-testid="rotating" />);

		advance(499);
		expect(word().textContent).toBe("plan");

		advance(1);
		expect(word().textContent).toBe("bridge");
	});

	it("stops the clock when it leaves the tree", () => {
		const { unmount } = render(<RotatingText text={WORDS} data-testid="rotating" />);
		expect(vi.getTimerCount()).toBe(1);

		unmount();

		expect(vi.getTimerCount()).toBe(0);
	});

	it("enters from the side opposite the one it leaves to, so the words scroll one way", () => {
		render(<RotatingText text="plan" data-testid="rotating" />);

		expect(word().dataset.enterY).toBe("50");
		expect(word().dataset.exitY).toBe("-50");
	});

	it("lets y flip the direction", () => {
		render(<RotatingText text="plan" y={30} data-testid="rotating" />);

		expect(word().dataset.enterY).toBe("-30");
		expect(word().dataset.exitY).toBe("30");
	});

	it("keeps the clipping frame's class apart from the text's", () => {
		const { container } = render(
			<RotatingText text="plan" containerClassName="h-8" className="font-bold" data-testid="rotating" />,
		);

		const frame = container.firstElementChild as HTMLElement;
		expect(frame.className).toContain("overflow-hidden");
		expect(frame.className).toContain("h-8");
		expect(word().className).toBe("font-bold");
	});
});
