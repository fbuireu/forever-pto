import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sidebar = vi.hoisted(() => ({ state: "expanded" }));

vi.mock("@ui/modules/core/animate/base/Sidebar", () => ({
	SidebarFooter: ({ children, ...props }: ComponentProps<"div">) => (
		<div data-testid="footer" {...props}>
			{children}
		</div>
	),
	SidebarMenu: ({ children, ...props }: ComponentProps<"ul">) => <ul {...props}>{children}</ul>,
	SidebarMenuItem: ({ children, ...props }: ComponentProps<"li">) => <li {...props}>{children}</li>,
	useSidebar: () => sidebar,
}));

vi.mock("./LanguageSelector", () => ({ LanguageSelector: () => <div data-testid="language" /> }));
vi.mock("./ThemeSelector", () => ({ ThemeSelector: () => <div data-testid="theme" /> }));

const { SidebarFooterButtons } = await import("./SidebarFooterButtons");

const menu = () => screen.getByRole("list");

const items = () => screen.getAllByRole("listitem");

beforeEach(() => {
	sidebar.state = "expanded";
});

describe("SidebarFooterButtons", () => {
	it("puts the language selector before the theme selector", () => {
		render(<SidebarFooterButtons />);

		expect(items()[0]?.querySelector("[data-testid='language']")).toBeTruthy();
		expect(items()[1]?.querySelector("[data-testid='theme']")).toBeTruthy();
	});

	it("lays the two side by side while the rail is expanded, the language one taking the slack", () => {
		render(<SidebarFooterButtons />);

		expect(menu().className).toContain("flex-row");
		expect(items()[0]?.className).toContain("grow");
		expect(items()[1]?.className).toContain("min-w-12");
	});

	it("stacks them full width once the rail has collapsed to icons", () => {
		sidebar.state = "collapsed";

		render(<SidebarFooterButtons />);

		expect(menu().className).toContain("flex-col");
		expect(menu().className).not.toContain("flex-row");
		expect(items().map((item) => item.className)).toStrictEqual(["w-full", "w-full"]);
	});

	it("drops the footer padding in icon mode so the buttons keep the rail's width", () => {
		render(<SidebarFooterButtons />);

		expect(screen.getByTestId("footer").className).toContain("group-data-[collapsible=icon]:px-0");
	});
});
