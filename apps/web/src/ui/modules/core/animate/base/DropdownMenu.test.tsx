import { render } from "@testing-library/react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionDivProps = ComponentProps<"div"> & {
	initial?: unknown;
	animate?: unknown;
	exit?: unknown;
	transition?: unknown;
	layout?: unknown;
	whileTap?: unknown;
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
				whileTap: _wt,
				style,
				...props
			}: MotionDivProps) => createElement("div", { style, ...props }, children),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

const positioned = vi.hoisted((): { sideOffset?: number; align?: string }[] => []);

vi.mock("@base-ui/react/menu", async () => {
	const { createElement, cloneElement, isValidElement } = await import("react");
	type RootProps = ComponentProps<"div"> & {
		onOpenChange?: (open: boolean) => void;
		open?: boolean;
		defaultOpen?: boolean;
	};
	type WithRender = ComponentProps<"div"> & { render?: ReactElement; keepMounted?: boolean };
	type ItemProps = ComponentProps<"div"> & { render?: ReactElement; disabled?: boolean };
	const Menu = {
		Root: ({ children, onOpenChange: _oc, open: _o, defaultOpen: _do, ...props }: RootProps) =>
			createElement("div", props, children),
		Trigger: ({ children, render: renderProp, ...props }: WithRender) =>
			renderProp && isValidElement(renderProp)
				? cloneElement(renderProp, props)
				: createElement("button", props, children),
		Portal: ({ children, keepMounted: _km, ...props }: WithRender) => createElement("div", props, children),
		Positioner: ({
			children,
			sideOffset,
			align,
			positionMethod: _pm,
			...props
		}: ComponentProps<"div"> & { sideOffset?: number; align?: string; positionMethod?: string }) => {
			positioned.push({ sideOffset, align });
			return createElement("div", props, children);
		},
		Popup: ({ children, render: renderProp, ...props }: WithRender) =>
			renderProp && isValidElement(renderProp)
				? cloneElement(renderProp, props, children)
				: createElement("div", { "data-slot": "dropdown-menu-content", ...props }, children),
		Item: ({ children, render: _r, disabled: _d, ...props }: ItemProps) => createElement("div", props, children),
	};
	return { Menu };
});

vi.mock("../effects/MotionHighlight", () => ({
	MotionHighlight: ({ children }: { children?: ReactNode }) => <>{children}</>,
	MotionHighlightItem: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

import {
	DROPDOWN_MENU_CONTENT_DEFAULTS,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./DropdownMenu";

describe("DropdownMenu", () => {
	it('renders with data-slot="dropdown-menu"', () => {
		const { container } = render(
			<DropdownMenu>
				<span />
			</DropdownMenu>,
		);
		expect(container.querySelector('[data-slot="dropdown-menu"]')).not.toBeNull();
	});

	it("starts closed (isOpen=false)", () => {
		const { container } = render(
			<DropdownMenu>
				<DropdownMenuContent>item</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(container.querySelector('[data-slot="dropdown-menu-content"]')).toBeNull();
	});

	it("opens when defaultOpen=true", () => {
		const { container } = render(
			<DropdownMenu defaultOpen>
				<DropdownMenuContent>item</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(container.querySelector('[data-slot="dropdown-menu-content"]')).not.toBeNull();
	});
});

describe("DropdownMenuContent", () => {
	it("places the menu by the defaults it publishes when the caller sets none", () => {
		positioned.length = 0;
		render(
			<DropdownMenu defaultOpen>
				<DropdownMenuContent>item</DropdownMenuContent>
			</DropdownMenu>,
		);

		expect(positioned.at(-1)).toEqual(DROPDOWN_MENU_CONTENT_DEFAULTS);
	});

	it("places the menu where the caller asks", () => {
		positioned.length = 0;
		render(
			<DropdownMenu defaultOpen>
				<DropdownMenuContent sideOffset={12} align="end">
					item
				</DropdownMenuContent>
			</DropdownMenu>,
		);

		expect(positioned.at(-1)).toEqual({ sideOffset: 12, align: "end" });
	});

	it("throws when rendered outside DropdownMenu", () => {
		expect(() => render(<DropdownMenuContent>item</DropdownMenuContent>)).toThrow(
			"useDropdownMenu must be used within a DropdownMenu",
		);
	});
});

describe("DropdownMenuTrigger", () => {
	it('renders with data-slot="dropdown-menu-trigger"', () => {
		const { container } = render(
			<DropdownMenu>
				<DropdownMenuTrigger>open</DropdownMenuTrigger>
			</DropdownMenu>,
		);
		expect(container.querySelector('[data-slot="dropdown-menu-trigger"]')).not.toBeNull();
	});
});

describe("DropdownMenuItem", () => {
	it("renders inside DropdownMenu without throwing", () => {
		expect(() =>
			render(
				<DropdownMenu>
					<DropdownMenuItem>item</DropdownMenuItem>
				</DropdownMenu>,
			),
		).not.toThrow();
	});
});
