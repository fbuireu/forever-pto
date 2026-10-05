import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, lazy, type ReactNode, Suspense } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@ui/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("@ui/utils/cookie", () => ({ setCookie: vi.fn().mockResolvedValue(undefined) }));

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
			div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, layout: _l, ...props }: MotionDivProps) =>
				createElement("div", props, children),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

vi.mock("@ui/modules/core/animate/effects/MotionHighlight", () => ({
	MotionHighlight: ({ children }: { children?: ReactNode }) => <>{children}</>,
	MotionHighlightItem: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("@ui/modules/core/animate/icons/PanelLeft", () => ({ PanelLeftIcon: () => <svg /> }));
vi.mock("@ui/modules/core/animate/icons/ChevronDown", () => ({
	ChevronDown: ({ className }: { className?: string }) => <svg data-testid="chevron" className={className} />,
}));

vi.mock("@ui/modules/core/animate/base/Tooltip", () => ({
	Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
	TooltipContent: ({ children }: { children?: ReactNode }) => <div role="tooltip">{children}</div>,
	TooltipProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
	TooltipTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

import { SidebarProvider } from "@ui/modules/core/animate/base/Sidebar";
import { SidebarCollapsibleGroup } from "./SidebarCollapsibleGroup";

const LABEL = "Steps";
const TOOLTIP = "Your steps";

interface RenderGroupParams {
	defaultOpen?: boolean;
	anchor?: string;
	expanded?: boolean;
	icon?: ReactNode;
}

const renderGroup = ({
	defaultOpen,
	anchor,
	expanded = true,
	icon = <svg data-testid="icon" />,
}: RenderGroupParams = {}) =>
	render(
		<SidebarProvider open={expanded}>
			<SidebarCollapsibleGroup
				defaultOpen={defaultOpen}
				icon={icon}
				label={LABEL}
				tooltip={TOOLTIP}
				data-tutorial={anchor}
			>
				<p>body</p>
			</SidebarCollapsibleGroup>
		</SidebarProvider>,
	);

const trigger = () => screen.getByRole("button", { name: LABEL });

const lazyNode = (node: ReactNode) => lazy(() => Promise.resolve({ default: node as never })) as unknown as ReactNode;

describe("SidebarCollapsibleGroup draws its own trigger", () => {
	it("is one button, the sidebar's menu button, and holds no other button", () => {
		const { container } = renderGroup();

		expect(screen.getAllByRole("button")).toHaveLength(1);
		expect(trigger().dataset.sidebar).toBe("menu-button");
		expect(container.querySelector("button button")).toBeNull();
	});

	it("puts the icon, the label and the chevron inside it, in that order", () => {
		renderGroup();

		const parts = [...trigger().children].map((part) => part.getAttribute("data-testid") ?? part.textContent);

		expect(parts).toStrictEqual(["icon", LABEL, "chevron"]);
	});

	it("gives it the folding semantics of the collapsible, and nothing else wrapped around them", () => {
		renderGroup({ defaultOpen: true });

		expect(trigger().getAttribute("aria-expanded")).toBe("true");
		expect(trigger().getAttribute("aria-controls")).toBe(screen.getByText("body").parentElement?.id);
		expect(trigger().parentElement?.dataset.slot).toBe("collapsible");
	});

	it("keeps it a single button when the icon arrives as a lazy node, as one a server component built can", async () => {
		const { container } = renderGroup({
			icon: <Suspense fallback={null}>{lazyNode(<svg data-testid="icon" />)}</Suspense>,
		});

		expect(await screen.findByTestId("icon")).toBeDefined();
		expect(screen.getAllByRole("button")).toHaveLength(1);
		expect(container.querySelector("button button")).toBeNull();
	});

	it("hides the label and the chevron when the rail collapses to its icons", () => {
		renderGroup();

		expect(within(trigger()).getByText(LABEL).className).toContain("group-data-[collapsible=icon]:hidden");
		expect(within(trigger()).getByTestId("chevron").className).toContain("group-data-[collapsible=icon]:hidden");
	});

	it("turns the chevron down with the group, through the group's own name", () => {
		renderGroup();

		const chevron = within(trigger()).getByTestId("chevron").className;

		expect(chevron).toContain("-rotate-90");
		expect(chevron).toContain("group-data-[open]/collapsible:rotate-0");
		expect(trigger().closest(".group\\/collapsible")).not.toBeNull();
	});

	it("names the tooltip it hands the rail, which shows only once the rail is collapsed", () => {
		const { unmount } = renderGroup({ expanded: true });
		expect(screen.queryByRole("tooltip")).toBeNull();
		unmount();

		renderGroup({ expanded: false });

		expect(screen.getByRole("tooltip").textContent).toBe(TOOLTIP);
	});
});

describe("SidebarCollapsibleGroup folds", () => {
	const state = () => trigger().getAttribute("aria-expanded");

	it("starts folded unless told otherwise", () => {
		renderGroup();

		expect(state()).toBe("false");
	});

	it("starts open when asked to", () => {
		renderGroup({ defaultOpen: true });

		expect(state()).toBe("true");
	});

	it("folds and unfolds from its trigger", async () => {
		renderGroup();

		await userEvent.click(trigger());
		expect(state()).toBe("true");

		await userEvent.click(trigger());
		expect(state()).toBe("false");
	});

	it("reads as closed while the rail is collapsed, whatever it was told", () => {
		renderGroup({ defaultOpen: true, expanded: false });

		expect(state()).toBe("false");
	});

	it("comes back open once the rail expands again, since the collapse did not change its own state", () => {
		const group = (expanded: boolean) => (
			<SidebarProvider open={expanded}>
				<SidebarCollapsibleGroup defaultOpen icon={<svg />} label={LABEL} tooltip={TOOLTIP}>
					<p>body</p>
				</SidebarCollapsibleGroup>
			</SidebarProvider>
		);
		const { rerender } = render(group(false));
		expect(state()).toBe("false");

		rerender(group(true));

		expect(state()).toBe("true");
	});

	it("keeps its content mounted while folded, so the tutorial can still find it", () => {
		renderGroup();

		expect(screen.getByText("body")).toBeTruthy();
	});

	it("carries the tutorial anchor it was given", () => {
		const { container } = renderGroup({ anchor: "sidebar-tools" });

		expect(container.querySelector('[data-slot="collapsible"]')?.getAttribute("data-tutorial")).toBe("sidebar-tools");
	});

	it("carries no anchor attribute at all when none was given", () => {
		const { container } = renderGroup();

		expect(container.querySelector('[data-slot="collapsible"]')?.hasAttribute("data-tutorial")).toBe(false);
	});
});
