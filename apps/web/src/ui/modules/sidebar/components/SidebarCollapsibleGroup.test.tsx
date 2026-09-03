import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface CollapsibleMockProps {
	children: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	"data-tutorial"?: string;
}

const sidebar = vi.hoisted(() => ({ state: "expanded" }));

const toggle = vi.hoisted(() => ({ current: () => {} }));

vi.mock("@ui/modules/core/animate/base/Sidebar", () => ({ useSidebar: () => sidebar }));

vi.mock("@ui/modules/core/animate/base/Collapsible", () => ({
	Collapsible: ({ children, open, onOpenChange, ...props }: CollapsibleMockProps) => {
		toggle.current = () => onOpenChange?.(!open);
		return (
			<div data-testid="collapsible" data-state={open ? "open" : "closed"} data-tutorial={props["data-tutorial"]}>
				{children}
			</div>
		);
	},
	CollapsibleTrigger: ({ children }: { children: ReactNode }) => (
		<button type="button" onClick={() => toggle.current()}>
			{children}
		</button>
	),
	CollapsibleContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const { SidebarCollapsibleGroup } = await import("./SidebarCollapsibleGroup");

interface RenderGroupParams {
	defaultOpen?: boolean;
	anchor?: string;
}

const renderGroup = ({ defaultOpen, anchor }: RenderGroupParams = {}) =>
	render(
		<SidebarCollapsibleGroup defaultOpen={defaultOpen} trigger={<span>Steps</span>} data-tutorial={anchor}>
			<p>body</p>
		</SidebarCollapsibleGroup>,
	);

const state = () => screen.getByTestId("collapsible").dataset.state;

beforeEach(() => {
	sidebar.state = "expanded";
});

describe("SidebarCollapsibleGroup", () => {
	it("starts folded unless told otherwise", () => {
		renderGroup();

		expect(state()).toBe("closed");
	});

	it("starts open when asked to", () => {
		renderGroup({ defaultOpen: true });

		expect(state()).toBe("open");
	});

	it("folds and unfolds from its trigger", async () => {
		renderGroup();

		await userEvent.click(screen.getByRole("button", { name: "Steps" }));
		expect(state()).toBe("open");

		await userEvent.click(screen.getByRole("button", { name: "Steps" }));
		expect(state()).toBe("closed");
	});

	it("reads as closed while the rail is collapsed, whatever it was told", () => {
		sidebar.state = "collapsed";

		renderGroup({ defaultOpen: true });

		expect(state()).toBe("closed");
	});

	it("comes back open once the rail expands again, since the collapse did not change its own state", () => {
		sidebar.state = "collapsed";
		const { rerender } = renderGroup({ defaultOpen: true });
		expect(state()).toBe("closed");

		sidebar.state = "expanded";
		rerender(
			<SidebarCollapsibleGroup defaultOpen trigger={<span>Steps</span>}>
				<p>body</p>
			</SidebarCollapsibleGroup>,
		);

		expect(state()).toBe("open");
	});

	it("keeps its content mounted while folded, so the tutorial can still find it", () => {
		renderGroup();

		expect(screen.getByText("body")).toBeTruthy();
	});

	it("carries the tutorial anchor it was given", () => {
		renderGroup({ anchor: "sidebar-tools" });

		expect(screen.getByTestId("collapsible").dataset.tutorial).toBe("sidebar-tools");
	});

	it("carries no anchor attribute at all when none was given", () => {
		renderGroup();

		expect(screen.getByTestId("collapsible").hasAttribute("data-tutorial")).toBe(false);
	});
});
