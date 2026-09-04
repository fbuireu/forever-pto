import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionDivProps = ComponentProps<"div"> & {
	initial?: unknown;
	animate?: unknown;
	exit?: unknown;
	transition?: unknown;
};

vi.mock("motion/react", async () => {
	const { createElement, Fragment } = await import("react");
	return {
		m: {
			div: ({ children, initial: _i, animate: _a, exit: _e, transition, style, ...props }: MotionDivProps) =>
				createElement("div", { style, "data-transition": JSON.stringify(transition), ...props }, children),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

vi.mock("@base-ui/react/popover", async () => {
	const { createElement, cloneElement, Fragment } = await import("react");
	type RootProps = { children?: ReactNode; onOpenChange?: (open: boolean) => void };
	type TriggerProps = ComponentProps<"button"> & { render?: ReactElement };
	type RenderableProps = ComponentProps<"div"> & {
		render?: ReactElement;
		keepMounted?: boolean;
		initialFocus?: unknown;
		finalFocus?: unknown;
	};
	const renderable =
		(slot: string) =>
		({
			render: renderProp,
			children,
			keepMounted: _k,
			initialFocus: _if,
			finalFocus: _ff,
			...props
		}: RenderableProps) =>
			renderProp
				? cloneElement(
						renderProp,
						props as Record<string, unknown>,
						children ?? (renderProp.props as { children?: ReactNode }).children,
					)
				: createElement("div", { "data-slot": slot, ...props }, children);
	return {
		Popover: {
			Root: ({ children, onOpenChange }: RootProps) =>
				createElement(
					Fragment,
					null,
					createElement("button", { type: "button", "data-testid": "base-open", onClick: () => onOpenChange?.(true) }),
					createElement("button", {
						type: "button",
						"data-testid": "base-close",
						onClick: () => onOpenChange?.(false),
					}),
					children,
				),
			Trigger: ({ children, render: renderProp, ...props }: TriggerProps) =>
				renderProp ? cloneElement(renderProp, props) : createElement("button", { type: "button", ...props }, children),
			Portal: ({ children }: { children?: ReactNode; keepMounted?: boolean }) =>
				createElement(Fragment, null, children),
			Positioner: renderable("base-positioner"),
			Popup: renderable("base-popup"),
			Backdrop: renderable("base-backdrop"),
			Title: renderable("base-title"),
			Description: renderable("base-description"),
			Close: ({ children, ...props }: ComponentProps<"button">) =>
				createElement("button", { type: "button", ...props }, children),
		},
	};
});

import {
	Popover,
	PopoverBackdrop,
	PopoverClose,
	PopoverDescription,
	PopoverPopup,
	PopoverPortal,
	PopoverPositioner,
	PopoverTitle,
	PopoverTrigger,
} from "./Popover";

interface RenderPopoverParams {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	asChild?: boolean;
}

const renderPopover = ({ open, defaultOpen, onOpenChange, asChild }: RenderPopoverParams = {}) =>
	render(
		<Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild={asChild}>{asChild ? <a href="/help">help</a> : "help"}</PopoverTrigger>
			<PopoverPortal>
				<PopoverBackdrop />
				<PopoverPositioner>
					<PopoverPopup className="panel">
						<PopoverTitle>Title</PopoverTitle>
						<PopoverDescription>Body</PopoverDescription>
						<PopoverClose>close</PopoverClose>
					</PopoverPopup>
				</PopoverPositioner>
			</PopoverPortal>
		</Popover>,
	);

const body = () => screen.queryByText("Body");
const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`);

describe("Popover", () => {
	it("keeps the portal empty until the primitive reports an open, then mounts it", () => {
		renderPopover();
		expect(body()).toBeNull();

		fireEvent.click(screen.getByTestId("base-open"));

		expect(body()).not.toBeNull();
	});

	it("takes the portal down again when the primitive reports a close", () => {
		renderPopover({ defaultOpen: true });
		expect(body()).not.toBeNull();

		fireEvent.click(screen.getByTestId("base-close"));

		expect(body()).toBeNull();
	});

	it("tells the caller about every change", () => {
		const onOpenChange = vi.fn();
		renderPopover({ onOpenChange });

		fireEvent.click(screen.getByTestId("base-open"));
		fireEvent.click(screen.getByTestId("base-close"));

		expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false]);
	});

	it("follows a controlled open prop", () => {
		const { rerender } = render(
			<Popover open>
				<PopoverPortal>
					<PopoverPopup>Body</PopoverPopup>
				</PopoverPortal>
			</Popover>,
		);
		expect(body()).not.toBeNull();

		rerender(
			<Popover open={false}>
				<PopoverPortal>
					<PopoverPopup>Body</PopoverPopup>
				</PopoverPortal>
			</Popover>,
		);

		expect(body()).toBeNull();
	});

	it("wraps the trigger's text in a button carrying the trigger slot", () => {
		renderPopover();

		expect(screen.getByRole("button", { name: "help" }).dataset.slot).toBe("popover-trigger");
	});

	it("renders the child itself as the trigger when asChild is set", () => {
		renderPopover({ asChild: true });

		expect(screen.getByRole("link", { name: "help" }).dataset.slot).toBe("popover-trigger");
		expect(screen.queryByRole("button", { name: "help" })).toBeNull();
	});

	it("renders the popup as a motion div carrying the slot, the caller's class and a spring by default", () => {
		renderPopover({ defaultOpen: true });

		const popup = slot("popover-popup") as HTMLElement;
		expect(popup.className).toContain("panel");
		expect(JSON.parse(popup.dataset.transition ?? "{}")).toMatchObject({ type: "spring", stiffness: 300 });
	});

	it("lets the caller replace the transition", () => {
		render(
			<Popover defaultOpen>
				<PopoverPortal>
					<PopoverPopup transition={{ duration: 0.1 }}>Body</PopoverPopup>
				</PopoverPortal>
			</Popover>,
		);

		expect(JSON.parse((slot("popover-popup") as HTMLElement).dataset.transition ?? "{}")).toEqual({ duration: 0.1 });
	});

	it("marks backdrop, positioner, title, description and close with their slots", () => {
		renderPopover({ defaultOpen: true });

		for (const name of [
			"popover-backdrop",
			"popover-positioner",
			"popover-title",
			"popover-description",
			"popover-close",
		]) {
			expect(slot(name)).not.toBeNull();
		}
		expect(screen.getByRole("button", { name: "close" }).dataset.slot).toBe("popover-close");
	});

	it("refuses a portal outside Popover, since it has no open state to read", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => render(<PopoverPortal />)).toThrow("useContext must be used within PopoverContext");

		error.mockRestore();
	});
});
