import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionButtonProps = ComponentProps<"button"> & {
	whileTap?: unknown;
	whileHover?: unknown;
	initial?: unknown;
	animate?: unknown;
	exit?: unknown;
	transition?: unknown;
};
type MotionSvgProps = ComponentProps<"svg"> & {
	initial?: unknown;
	animate?: unknown;
	exit?: unknown;
	transition?: unknown;
};
type MotionPathProps = ComponentProps<"path"> & { variants?: unknown };

vi.mock("motion/react", async () => {
	const { createElement, Fragment, forwardRef } = await import("react");
	return {
		m: {
			button: forwardRef<HTMLButtonElement, MotionButtonProps>(
				(
					{ children, whileTap: _wt, whileHover: _wh, initial: _i, animate: _a, exit: _e, transition: _t, ...props },
					ref,
				) => createElement("button", { ref, ...props }, children),
			),
			svg: ({ children, initial: _i, animate, exit: _e, transition: _t, ...props }: MotionSvgProps) =>
				createElement("svg", { "data-animate": animate, ...props }, children),
			path: ({ variants: _v, strokeLinecap, strokeLinejoin, ...props }: MotionPathProps) =>
				createElement("path", { strokeLinecap, strokeLinejoin, ...props }),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

vi.mock("@base-ui/react/checkbox", async () => {
	const { createElement, forwardRef } = await import("react");
	type RootProps = ComponentProps<"button"> & {
		onCheckedChange?: (checked: boolean, details: Record<string, unknown>) => void;
		checked?: boolean;
		defaultChecked?: boolean;
		render?: ReactElement;
		keepMounted?: boolean;
	};
	const Root = forwardRef<HTMLButtonElement, RootProps>(
		({ children, onCheckedChange, checked, defaultChecked: _dc, render: _r, keepMounted: _km, ...props }, ref) =>
			createElement(
				"button",
				{
					ref,
					...props,
					"data-checked": String(checked),
					onClick: () => onCheckedChange?.(!checked, {}),
				},
				children,
			),
	);
	Root.displayName = "Checkbox.Root";
	return {
		Checkbox: {
			Root,
			Indicator: ({ children, keepMounted: _km, ...props }: ComponentProps<"span"> & { keepMounted?: boolean }) =>
				createElement("span", props, children),
		},
	};
});

import { Checkbox } from "./Checkbox";

type Assignable<TCandidate, TTarget> = TCandidate extends TTarget ? true : false;

const NAMELESS_PROPS_ARE_REJECTED: Assignable<{ checked: boolean }, ComponentProps<typeof Checkbox>> = false;

describe("Checkbox", () => {
	it("renders unchecked by default", () => {
		const { container } = render(<Checkbox aria-label="Select Christmas Day" />);
		expect(container.querySelector('[data-animate="unchecked"]')).not.toBeNull();
		expect(container.querySelector('[data-animate="checked"]')).toBeNull();
	});

	it("renders checked when defaultChecked=true", () => {
		const { container } = render(<Checkbox defaultChecked aria-label="Select Christmas Day" />);
		expect(container.querySelector('[data-animate="checked"]')).not.toBeNull();
	});

	it("calls onCheckedChange when clicked", () => {
		const spy = vi.fn();
		const { container } = render(<Checkbox checked={false} onCheckedChange={spy} aria-label="Select Christmas Day" />);
		const root = container.querySelector('[data-slot="checkbox"]') as HTMLButtonElement;
		fireEvent.click(root);
		expect(spy).toHaveBeenCalledWith(true, {});
	});

	it("syncs internal state when the controlled checked prop changes", () => {
		const { rerender, container } = render(<Checkbox checked={false} aria-label="Select Christmas Day" />);
		expect(container.querySelector('[data-animate="unchecked"]')).not.toBeNull();

		rerender(<Checkbox checked={true} aria-label="Select Christmas Day" />);
		expect(container.querySelector('[data-animate="checked"]')).not.toBeNull();
	});

	it('renders with data-slot="checkbox"', () => {
		const { container } = render(<Checkbox aria-label="Select Christmas Day" />);
		expect(container.querySelector('[data-slot="checkbox"]')).not.toBeNull();
	});

	it("does not accept a nameless props object, because it renders a button that has none of its own", () => {
		expect(NAMELESS_PROPS_ARE_REJECTED).toBe(false);
		expect(readFileSync(join(__dirname, "Checkbox.tsx"), "utf8")).toContain("& CheckboxAccessibleName");
	});

	it("accepts an id as the name, on the same terms as Switch", () => {
		const { container } = render(<Checkbox id="select-all" checked={false} />);
		expect(container.querySelector("#select-all")).not.toBeNull();
	});
});
