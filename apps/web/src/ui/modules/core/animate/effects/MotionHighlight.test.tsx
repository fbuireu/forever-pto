import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

interface MotionDivProps extends ComponentProps<"div"> {
	layoutId?: string;
	animate?: unknown;
	transition?: unknown;
	initial?: unknown;
	exit?: unknown;
}

vi.mock("motion/react", async () => {
	const { createElement, Fragment } = await import("react");
	return {
		m: {
			div: ({ children, layoutId: _l, animate: _a, transition: _t, initial: _i, exit: _e, ...props }: MotionDivProps) =>
				createElement("div", props, children),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

import { MotionHighlight, MotionHighlightItem } from "./MotionHighlight";

const TRANSITION = { type: "spring", stiffness: 350, damping: 35 } as const;

describe("MotionHighlight (children mode)", () => {
	it("renders children", () => {
		const { getByText } = render(
			<MotionHighlight transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">item</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		expect(getByText("item")).toBeTruthy();
	});

	it("shows highlight for the default active item", () => {
		const { container } = render(
			<MotionHighlight value="a" transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
				<MotionHighlightItem value="b">
					<button type="button">B</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		expect(container.querySelector('[data-slot="motion-highlight"]')).not.toBeNull();
	});

	it("does not show highlight when no active value", () => {
		const { container } = render(
			<MotionHighlight transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		expect(container.querySelector('[data-slot="motion-highlight"]')).toBeNull();
	});

	it("clicking an item activates it", () => {
		const { container } = render(
			<MotionHighlight transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		fireEvent.click(container.querySelector('[data-slot="motion-highlight-item-container"]') as HTMLElement);
		expect(container.querySelector('[data-slot="motion-highlight"]')).not.toBeNull();
	});
});

describe("MotionHighlight (controlled value)", () => {
	it("sets active item from value prop", () => {
		const { container } = render(
			<MotionHighlight value="b" transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
				<MotionHighlightItem value="b">
					<button type="button">B</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		expect(container.querySelector('[data-value="b"][data-active="true"]')).not.toBeNull();
		expect(container.querySelector('[data-value="a"][data-active="false"]')).not.toBeNull();
	});

	it("updates active item when value prop changes", () => {
		const { container, rerender } = render(
			<MotionHighlight value="a" transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
				<MotionHighlightItem value="b">
					<button type="button">B</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		expect(container.querySelector('[data-value="a"][data-active="true"]')).not.toBeNull();

		rerender(
			<MotionHighlight value="b" transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
				<MotionHighlightItem value="b">
					<button type="button">B</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		expect(container.querySelector('[data-value="b"][data-active="true"]')).not.toBeNull();
	});
});

describe("MotionHighlight (parent mode)", () => {
	it("renders motion-highlight-container", () => {
		const { container } = render(
			<MotionHighlight mode="parent" transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		expect(container.querySelector('[data-slot="motion-highlight-container"]')).not.toBeNull();
	});

	it("clicking item in parent mode sets it as active", () => {
		const { container } = render(
			<MotionHighlight mode="parent" transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		fireEvent.click(container.querySelector('[data-slot="motion-highlight-item-container"]') as HTMLElement);
		expect(container.querySelector('[data-value="a"][data-active="true"]')).not.toBeNull();
	});
});

describe("MotionHighlight (hover mode)", () => {
	it("activates item on mouseenter", () => {
		const { container } = render(
			<MotionHighlight hover transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		fireEvent.mouseEnter(container.querySelector('[data-slot="motion-highlight-item-container"]') as HTMLElement);
		expect(container.querySelector('[data-slot="motion-highlight"]')).not.toBeNull();
	});

	it("deactivates item on mouseleave", () => {
		const { container } = render(
			<MotionHighlight hover transition={TRANSITION}>
				<MotionHighlightItem value="a">
					<button type="button">A</button>
				</MotionHighlightItem>
			</MotionHighlight>,
		);
		const item = container.querySelector('[data-slot="motion-highlight-item-container"]') as HTMLElement;
		fireEvent.mouseEnter(item);
		fireEvent.mouseLeave(item);
		expect(container.querySelector('[data-slot="motion-highlight"]')).toBeNull();
	});
});

describe("MotionHighlightItem", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("throws when rendered outside MotionHighlight", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() =>
			render(
				<MotionHighlightItem value="x">
					<button type="button">X</button>
				</MotionHighlightItem>,
			),
		).toThrow("useMotionHighlight must be used within a MotionHighlightProvider");
	});
});
