import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

interface MotionDivProps extends ComponentProps<"div"> {
	initial?: { y?: number };
	animate?: unknown;
	exit?: { y?: number };
	transition?: unknown;
}

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

const word = (): HTMLElement => screen.getByText("plan");

describe("RotatingText", () => {
	it("shows the text it is given", () => {
		render(<RotatingText text="plan" />);

		expect(word().textContent).toBe("plan");
	});

	it("starts no clock of its own, since the caller changes the text", () => {
		vi.useFakeTimers();
		try {
			render(<RotatingText text="plan" />);

			expect(vi.getTimerCount()).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});

	it("swaps to the next text when the caller changes it", () => {
		const { rerender } = render(<RotatingText text="plan" />);

		rerender(<RotatingText text="bridge" />);

		expect(screen.getByText("bridge")).toBeTruthy();
		expect(screen.queryByText("plan")).toBeNull();
	});

	it("enters from the side opposite the one it leaves to, so the words scroll one way", () => {
		render(<RotatingText text="plan" />);

		expect(word().dataset.enterY).toBe("50");
		expect(word().dataset.exitY).toBe("-50");
	});

	it("clips its words to its own frame", () => {
		const { container } = render(<RotatingText text="plan" />);

		expect((container.firstElementChild as HTMLElement).className).toContain("overflow-hidden");
	});
});
