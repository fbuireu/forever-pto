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

vi.mock("@base-ui/react/dialog", async () => {
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
		Dialog: {
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
			Backdrop: renderable("base-backdrop"),
			Popup: renderable("base-popup"),
			Title: renderable("base-title"),
			Description: renderable("base-description"),
			Close: ({ children, ...props }: ComponentProps<"button">) =>
				createElement("button", { type: "button", ...props }, children),
		},
	};
});

import {
	Dialog,
	DialogBackdrop,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPopup,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from "./Dialog";

interface RenderDialogParams {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	asChild?: boolean;
}

const renderDialog = ({ open, defaultOpen, onOpenChange, asChild }: RenderDialogParams = {}) =>
	render(
		<Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild={asChild}>{asChild ? <a href="/settings">settings</a> : "settings"}</DialogTrigger>
			<DialogPortal>
				<DialogBackdrop />
				<DialogPopup className="modal" from="bottom">
					<DialogHeader>
						<DialogTitle>Title</DialogTitle>
						<DialogDescription>Body</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose>close</DialogClose>
					</DialogFooter>
				</DialogPopup>
			</DialogPortal>
		</Dialog>,
	);

const body = () => screen.queryByText("Body");
const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;

describe("Dialog", () => {
	it("keeps the portal empty until the primitive reports an open, then mounts it", () => {
		renderDialog();
		expect(body()).toBeNull();

		fireEvent.click(screen.getByTestId("base-open"));

		expect(body()).not.toBeNull();
	});

	it("takes the portal down again when the primitive reports a close", () => {
		renderDialog({ defaultOpen: true });
		expect(body()).not.toBeNull();

		fireEvent.click(screen.getByTestId("base-close"));

		expect(body()).toBeNull();
	});

	it("tells the caller about every change", () => {
		const onOpenChange = vi.fn();
		renderDialog({ onOpenChange });

		fireEvent.click(screen.getByTestId("base-open"));
		fireEvent.click(screen.getByTestId("base-close"));

		expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false]);
	});

	it("follows a controlled open prop", () => {
		const { rerender } = render(
			<Dialog open>
				<DialogPortal>
					<DialogPopup>Body</DialogPopup>
				</DialogPortal>
			</Dialog>,
		);
		expect(body()).not.toBeNull();

		rerender(
			<Dialog open={false}>
				<DialogPortal>
					<DialogPopup>Body</DialogPopup>
				</DialogPortal>
			</Dialog>,
		);

		expect(body()).toBeNull();
	});

	it("wraps the trigger's text in a button carrying the trigger slot", () => {
		renderDialog();

		expect(screen.getByRole("button", { name: "settings" }).dataset.slot).toBe("dialog-trigger");
	});

	it("renders the child itself as the trigger when asChild is set", () => {
		renderDialog({ asChild: true });

		expect(screen.getByRole("link", { name: "settings" }).dataset.slot).toBe("dialog-trigger");
		expect(screen.queryByRole("button", { name: "settings" })).toBeNull();
	});

	it("renders the popup as a motion div with the slot, the caller's class and a short ease by default", () => {
		renderDialog({ defaultOpen: true });

		const popup = slot("dialog-popup") as HTMLElement;
		expect(popup.className).toContain("modal");
		expect(JSON.parse(popup.dataset.transition ?? "{}")).toEqual({ duration: 0.2, ease: "easeInOut" });
	});

	it("keeps the from prop to itself rather than leaking it onto the element", () => {
		renderDialog({ defaultOpen: true });

		expect((slot("dialog-popup") as HTMLElement).getAttribute("from")).toBeNull();
	});

	it("lets the caller replace the popup's and the backdrop's transitions", () => {
		render(
			<Dialog defaultOpen>
				<DialogPortal>
					<DialogBackdrop transition={{ duration: 0.5 }} />
					<DialogPopup transition={{ duration: 0.1 }}>Body</DialogPopup>
				</DialogPortal>
			</Dialog>,
		);

		expect(JSON.parse(slot("dialog-backdrop")?.dataset.transition ?? "{}")).toEqual({ duration: 0.5 });
		expect(JSON.parse(slot("dialog-popup")?.dataset.transition ?? "{}")).toEqual({ duration: 0.1 });
	});

	it("marks backdrop, header, footer, title, description and close with their slots", () => {
		renderDialog({ defaultOpen: true });

		for (const name of [
			"dialog-backdrop",
			"dialog-header",
			"dialog-footer",
			"dialog-title",
			"dialog-description",
			"dialog-close",
		]) {
			expect(slot(name)).not.toBeNull();
		}
		expect(slot("dialog-header")?.contains(slot("dialog-title"))).toBe(true);
		expect(slot("dialog-footer")?.contains(screen.getByRole("button", { name: "close" }))).toBe(true);
	});

	it("refuses a portal outside Dialog, since it has no open state to read", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => render(<DialogPortal />)).toThrow("useContext must be used within DialogContext");

		error.mockRestore();
	});
});
