import { render } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

interface MotionDivProps extends ComponentProps<"div"> {
	animate?: unknown;
	transition?: unknown;
	initial?: unknown;
	exit?: unknown;
	layout?: unknown;
}

const { measuredRef } = vi.hoisted(() => ({
	measuredRef: { current: null as HTMLElement | null },
}));

vi.mock("motion/react", async () => {
	const { createElement } = await import("react");
	return {
		m: {
			div: ({ children, animate, transition: _t, initial: _i, exit: _e, layout: _l, ...props }: MotionDivProps) =>
				createElement("div", { ...props, "data-animate": JSON.stringify(animate ?? null) }, children),
		},
	};
});

vi.mock("@ui/hooks/useAutoHeight", () => ({
	useAutoHeight: () => ({ ref: measuredRef, height: 100 }),
}));

import { AutoHeight } from "./AutoHeight";

function readAnimate(element: Element | null): unknown {
	return JSON.parse(element?.getAttribute("data-animate") ?? "null");
}

describe("AutoHeight", () => {
	it("renders children", () => {
		const { getByText } = render(
			<AutoHeight deps={[]}>
				<span>content</span>
			</AutoHeight>,
		);
		expect(getByText("content")).toBeTruthy();
	});

	it("forwards className to the outer element", () => {
		const { container } = render(
			<AutoHeight deps={[]} className="test-class">
				<span />
			</AutoHeight>,
		);
		expect(container.querySelector(".test-class")).not.toBeNull();
	});

	it("forwards extra props to the outer element", () => {
		const { container } = render(
			<AutoHeight deps={[]} data-testid="ah-root">
				<span />
			</AutoHeight>,
		);
		expect(container.querySelector('[data-testid="ah-root"]')).not.toBeNull();
	});

	it("attaches the measuring ref to the wrapper around the children", () => {
		const { getByText } = render(
			<AutoHeight deps={[]}>
				<span>measured</span>
			</AutoHeight>,
		);
		expect(measuredRef.current?.contains(getByText("measured"))).toBe(true);
	});

	it("animates the measured height", () => {
		const { container } = render(
			<AutoHeight deps={[]} data-testid="ah-root">
				<span />
			</AutoHeight>,
		);
		expect(readAnimate(container.querySelector('[data-testid="ah-root"]'))).toEqual({ height: 100 });
	});
});
