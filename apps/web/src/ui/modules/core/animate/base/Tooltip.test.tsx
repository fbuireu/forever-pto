import { render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const DIALOG_LAYER = 200;

vi.mock("../primitives/base/Tooltip", () => ({
	TooltipProvider: ({ children, delay, ...props }: ComponentProps<"div"> & { delay?: number }) => (
		<div data-primitive="tooltip-provider" data-delay={delay} {...props}>
			{children}
		</div>
	),
	Tooltip: ({ children, ...props }: ComponentProps<"div">) => (
		<div data-primitive="tooltip" {...props}>
			{children}
		</div>
	),
	TooltipTrigger: ({ children, ...props }: ComponentProps<"button">) => (
		<button data-primitive="tooltip-trigger" {...props}>
			{children}
		</button>
	),
	TooltipPortal: ({ children }: { children?: ReactNode }) => <>{children}</>,
	TooltipPositioner: ({
		children,
		sideOffset,
		className,
		...props
	}: ComponentProps<"div"> & { sideOffset?: number }) => (
		<div data-primitive="tooltip-positioner" data-side-offset={sideOffset} className={className} {...props}>
			{children}
		</div>
	),
	TooltipPopup: ({ children, className, style, ...props }: ComponentProps<"div">) => (
		<div data-primitive="tooltip-popup" className={className} style={style} {...props}>
			{children}
		</div>
	),
	TooltipArrow: (props: ComponentProps<"div">) => <div data-primitive="tooltip-arrow" {...props} />,
}));

import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipProvider, TooltipTrigger } from "./Tooltip";

describe("TooltipProvider", () => {
	it("opens a tooltip after the shared delay, so no call site repeats it", () => {
		const { container } = render(<TooltipProvider />);
		expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-provider"]')?.dataset.delay).toBe("200");
	});
});

describe("Tooltip", () => {
	it("mints no provider of its own, so the ambient one survives", () => {
		const { container } = render(
			<Tooltip>
				<span />
			</Tooltip>,
		);
		expect(container.querySelector('[data-primitive="tooltip-provider"]')).toBeNull();
	});

	it("leaves an enclosing provider as the nearest one", () => {
		const { container } = render(
			<TooltipProvider>
				<Tooltip>
					<span />
				</Tooltip>
			</TooltipProvider>,
		);
		const providers = container.querySelectorAll<HTMLElement>('[data-primitive="tooltip-provider"]');

		expect(providers).toHaveLength(1);
		expect(providers[0]?.dataset.delay).toBe("200");
	});
});

describe("TooltipTrigger", () => {
	it("renders without throwing", () => {
		expect(() => render(<TooltipTrigger>hover me</TooltipTrigger>)).not.toThrow();
	});
});

describe("TooltipContent", () => {
	it("applies className onto the popup", () => {
		const { container } = render(<TooltipContent className="custom-class">tip</TooltipContent>);
		expect(container.querySelector('[data-primitive="tooltip-popup"]')?.className).toContain("custom-class");
	});

	it("floats the positioner above a dialog and the mobile sidebar, so a field tooltip is never hidden behind either", () => {
		const { container } = render(<TooltipContent>hint</TooltipContent>);
		const layer = container.querySelector('[data-primitive="tooltip-positioner"]')?.className.match(/\bz-(\d+)\b/);

		expect(Number(layer?.[1])).toBeGreaterThan(DIALOG_LAYER);
	});

	it("keeps the bubble four pixels from its trigger", () => {
		const { container } = render(<TooltipContent>tip</TooltipContent>);
		expect(container.querySelector<HTMLElement>('[data-primitive="tooltip-positioner"]')?.dataset.sideOffset).toBe("4");
	});

	it("renders the arrow", () => {
		const { container } = render(<TooltipContent>tip</TooltipContent>);
		expect(container.querySelector('[data-primitive="tooltip-arrow"]')).not.toBeNull();
	});
});

describe("TooltipInfoTrigger", () => {
	it('renders with the "i" label', () => {
		const { getByText } = render(<TooltipInfoTrigger aria-label="About Efficiency" />);
		expect(getByText("i")).toBeTruthy();
	});

	it("sits at the end of its row", () => {
		const { container } = render(<TooltipInfoTrigger aria-label="About Efficiency" />);
		expect(container.querySelector('[data-primitive="tooltip-trigger"]')?.className).toContain("ml-auto");
	});
});

type Assignable<TCandidate, TTarget> = TCandidate extends TTarget ? true : false;

const NAMELESS_INFO_TRIGGER_IS_REJECTED: Assignable<{ id: string }, ComponentProps<typeof TooltipInfoTrigger>> = false;

describe("TooltipInfoTrigger's name", () => {
	it("requires one, since the i it draws is hidden from assistive tech", () => {
		expect(NAMELESS_INFO_TRIGGER_IS_REJECTED).toBe(false);
	});

	it("puts the name on the button that carries the tooltip", () => {
		const { container } = render(<TooltipInfoTrigger aria-label="About Efficiency" />);

		expect(container.querySelector('[data-primitive="tooltip-trigger"]')?.getAttribute("aria-label")).toBe(
			"About Efficiency",
		);
	});
});
