import { render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const DIALOG_LAYER = 200;

vi.mock("../primitives/base/Popover", () => ({
	Popover: ({ children, ...props }: ComponentProps<"div">) => (
		<div data-primitive="popover" {...props}>
			{children}
		</div>
	),
	PopoverTrigger: ({ children, ...props }: ComponentProps<"button">) => (
		<button data-primitive="popover-trigger" {...props}>
			{children}
		</button>
	),
	PopoverPortal: ({ children }: { children?: ReactNode }) => <>{children}</>,
	PopoverPositioner: ({
		children,
		align,
		sideOffset,
		className,
		...props
	}: ComponentProps<"div"> & { align?: string; sideOffset?: number }) => (
		<div
			data-primitive="popover-positioner"
			data-align={align}
			data-side-offset={sideOffset}
			className={className}
			{...props}
		>
			{children}
		</div>
	),
	PopoverPopup: ({
		children,
		className,
		initialFocus: _if,
		finalFocus: _ff,
		style,
		...props
	}: ComponentProps<"div"> & { initialFocus?: unknown; finalFocus?: unknown }) => (
		<div data-primitive="popover-popup" className={className} style={style} {...props}>
			{children}
		</div>
	),
}));

import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

describe("Popover", () => {
	it("renders without throwing", () => {
		expect(() =>
			render(
				<Popover>
					<span />
				</Popover>,
			),
		).not.toThrow();
	});
});

describe("PopoverTrigger", () => {
	it("renders without throwing", () => {
		expect(() => render(<PopoverTrigger>open</PopoverTrigger>)).not.toThrow();
	});
});

describe("PopoverContent", () => {
	it("applies className onto the popup", () => {
		const { container } = render(<PopoverContent className="custom-class">content</PopoverContent>);
		expect(container.querySelector('[data-primitive="popover-popup"]')?.className).toContain("custom-class");
	});

	it("centres the panel on its trigger", () => {
		const { container } = render(<PopoverContent>content</PopoverContent>);
		expect(container.querySelector<HTMLElement>('[data-primitive="popover-positioner"]')?.dataset.align).toBe("center");
	});

	it("keeps the panel four pixels from its trigger", () => {
		const { container } = render(<PopoverContent>content</PopoverContent>);
		expect(container.querySelector<HTMLElement>('[data-primitive="popover-positioner"]')?.dataset.sideOffset).toBe("4");
	});

	it("floats the positioner above a dialog, so a Combobox opened inside a modal is not hidden behind it", () => {
		const { container } = render(<PopoverContent>content</PopoverContent>);
		const layer = container.querySelector('[data-primitive="popover-positioner"]')?.className.match(/\bz-(\d+)\b/);

		expect(Number(layer?.[1])).toBeGreaterThan(DIALOG_LAYER);
	});
});
