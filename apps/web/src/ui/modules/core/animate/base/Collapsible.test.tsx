import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps, ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionDivProps = ComponentProps<"div"> & {
	initial?: unknown;
	animate?: unknown;
	exit?: unknown;
	transition?: unknown;
	layout?: unknown;
};

vi.mock("motion/react", async () => {
	const { createElement, Fragment } = await import("react");
	return {
		m: {
			div: ({
				children,
				initial: _i,
				animate: _a,
				exit: _e,
				transition: _t,
				layout: _l,
				style,
				...props
			}: MotionDivProps) => createElement("div", { style, ...props }, children),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

vi.mock("@base-ui/react/collapsible", async () => {
	const { createElement, cloneElement, isValidElement } = await import("react");
	type RootProps = ComponentProps<"div"> & {
		onOpenChange?: (open: boolean) => void;
		open?: boolean;
		defaultOpen?: boolean;
	};
	type TriggerProps = ComponentProps<"button"> & { render?: ReactElement };
	type PanelProps = ComponentProps<"div"> & {
		render?: (props: ComponentPropsWithoutRef<"div"> & { hidden?: boolean }, state: { open: boolean }) => ReactNode;
		keepMounted?: boolean;
	};
	return {
		Collapsible: {
			Root: ({ children, onOpenChange, open, defaultOpen, ...props }: RootProps) =>
				createElement(
					"div",
					{ ...props, "data-open": String(open ?? defaultOpen ?? "unset") },
					createElement("button", {
						type: "button",
						"data-testid": "primitive-toggle",
						onClick: () => onOpenChange?.(!(open ?? defaultOpen)),
					}),
					children,
				),
			Trigger: ({ children, render: renderProp, ...props }: TriggerProps) =>
				renderProp && isValidElement(renderProp)
					? cloneElement(renderProp, props)
					: createElement("button", props, children),
			Panel: ({ children, render: renderFn, keepMounted: _km, ...props }: PanelProps) => {
				if (typeof renderFn === "function") {
					return renderFn({ hidden: false, style: {}, className: "" }, { open: true });
				}
				return createElement("div", props, children);
			},
		},
	};
});

import { Collapsible, CollapsibleTrigger } from "./Collapsible";

describe("Collapsible", () => {
	it('renders with data-slot="collapsible"', () => {
		const { container } = render(<Collapsible />);
		expect(container.querySelector('[data-slot="collapsible"]')).not.toBeNull();
	});

	it("forwards defaultOpen to the primitive untouched", () => {
		const { container } = render(
			<Collapsible defaultOpen>
				<span />
			</Collapsible>,
		);
		expect(container.querySelector('[data-slot="collapsible"]')?.getAttribute("data-open")).toBe("true");
	});

	it("forwards a controlled open to the primitive untouched", () => {
		const { container } = render(
			<Collapsible open={false}>
				<span />
			</Collapsible>,
		);
		expect(container.querySelector('[data-slot="collapsible"]')?.getAttribute("data-open")).toBe("false");
	});

	it("leaves open unset when the caller sets neither", () => {
		const { container } = render(
			<Collapsible>
				<span />
			</Collapsible>,
		);
		expect(container.querySelector('[data-slot="collapsible"]')?.getAttribute("data-open")).toBe("unset");
	});

	it("forwards the primitive open change to the caller", () => {
		const onOpenChange = vi.fn();
		const { getByTestId } = render(
			<Collapsible open={false} onOpenChange={onOpenChange}>
				<span />
			</Collapsible>,
		);

		fireEvent.click(getByTestId("primitive-toggle"));

		expect(onOpenChange).toHaveBeenCalledWith(true);
	});
});

describe("CollapsibleTrigger", () => {
	it('renders with data-slot="collapsible-trigger"', () => {
		const { container } = render(
			<Collapsible>
				<CollapsibleTrigger>toggle</CollapsibleTrigger>
			</Collapsible>,
		);
		expect(container.querySelector('[data-slot="collapsible-trigger"]')).not.toBeNull();
	});

	it("renders child directly when asChild=true", () => {
		const { getByTestId } = render(
			<Collapsible>
				<CollapsibleTrigger asChild>
					<button type="button" data-testid="custom-trigger">
						toggle
					</button>
				</CollapsibleTrigger>
			</Collapsible>,
		);
		expect(getByTestId("custom-trigger")).toBeTruthy();
	});
});
