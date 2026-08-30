import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const viewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock("@ui/hooks/useMobile", () => ({ useIsMobile: () => viewport.isMobile }));
vi.mock("@ui/utils/cookie", () => ({ setCookie: vi.fn().mockResolvedValue(undefined) }));

type MotionDivProps = ComponentProps<"div"> & {
	initial?: unknown;
	animate?: unknown;
	exit?: unknown;
	transition?: unknown;
	layout?: unknown;
	whileTap?: unknown;
	whileHover?: unknown;
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
				whileHover: _wh,
				style,
				...props
			}: MotionDivProps) => createElement("div", { style, ...props }, children),
		},
		AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
	};
});

vi.mock("../effects/MotionHighlight", () => ({
	MotionHighlight: ({ children }: { children?: ReactNode }) => <>{children}</>,
	MotionHighlightItem: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("../icons/PanelLeft", () => ({ PanelLeftIcon: () => <svg /> }));

vi.mock("./Tooltip", () => ({
	Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
	TooltipContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	TooltipProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
	TooltipTrigger: ({ children, ...props }: ComponentProps<"button">) => <button {...props}>{children}</button>,
}));

import { Sidebar, SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar } from "./Sidebar";

describe("useSidebar", () => {
	it("throws when used outside SidebarProvider", () => {
		expect(() => renderHook(() => useSidebar())).toThrow("useSidebar must be used within a SidebarProvider.");
	});
});

describe("SidebarProvider", () => {
	const wrapper = ({ children }: { children: ReactNode }) => <SidebarProvider>{children}</SidebarProvider>;

	it("provides open=true by default", () => {
		const { result } = renderHook(() => useSidebar(), { wrapper });
		expect(result.current.open).toBe(true);
	});

	it('provides state="expanded" when open=true', () => {
		const { result } = renderHook(() => useSidebar(), { wrapper });
		expect(result.current.state).toBe("expanded");
	});

	it('provides state="collapsed" when defaultOpen=false', () => {
		const collapsedWrapper = ({ children }: { children: ReactNode }) => (
			<SidebarProvider defaultOpen={false}>{children}</SidebarProvider>
		);
		const { result } = renderHook(() => useSidebar(), { wrapper: collapsedWrapper });
		expect(result.current.state).toBe("collapsed");
		expect(result.current.open).toBe(false);
	});

	it("provides isMobile=false (mocked)", () => {
		const { result } = renderHook(() => useSidebar(), { wrapper });
		expect(result.current.isMobile).toBe(false);
	});

	it("provides a toggleSidebar function", () => {
		const { result } = renderHook(() => useSidebar(), { wrapper });
		expect(typeof result.current.toggleSidebar).toBe("function");
	});

	it("provides openMobile=false initially", () => {
		const { result } = renderHook(() => useSidebar(), { wrapper });
		expect(result.current.openMobile).toBe(false);
	});
});

const SRC_ROOT = resolve(__dirname, "../../../../..");
const MOUNT = /<SidebarProvider[\s/>]/g;

const sourceFiles = (directory: string): string[] =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") ? [path] : [];
	});

const mounts = sourceFiles(SRC_ROOT).flatMap((path) => {
	const found = readFileSync(path, "utf8").match(MOUNT) ?? [];
	return found.map(() => relative(SRC_ROOT, path).replaceAll("\\", "/"));
});

describe("SidebarProvider mount sites", () => {
	it("is mounted exactly once, so no consumer can resolve the wrong sidebar", () => {
		expect(mounts).toEqual(["app/[locale]/(app)/planner/layout.tsx"]);
	});
});

describe("Sidebar body styles", () => {
	it("writes no document-level style, so it cannot fight another module over the same global", () => {
		expect(readFileSync(join(__dirname, "Sidebar.tsx"), "utf8")).not.toMatch(/document\.body\.style/);
	});
});

const MobileHarness = () => (
	<SidebarProvider>
		<SidebarTrigger label="Toggle sidebar" />
		<Sidebar landmarkLabel="Planner controls">
			<button type="button">Country</button>
		</Sidebar>
	</SidebarProvider>
);

describe("Sidebar landmarks", () => {
	it("makes the desktop rail a landmark, so it is reachable by the landmark key", () => {
		viewport.isMobile = false;
		const { getByRole } = render(<MobileHarness />);

		expect(getByRole("complementary", { name: "Planner controls" })).toBeDefined();
	});
});

describe("Sidebar mobile drawer focus", () => {
	it("moves focus into the drawer it just opened, rather than leaving it on the trigger behind", () => {
		viewport.isMobile = true;
		const { getByRole } = render(<MobileHarness />);

		fireEvent.click(getByRole("button", { name: "Toggle sidebar" }));

		expect(document.activeElement).toBe(getByRole("dialog", { name: "Planner controls" }));
		viewport.isMobile = false;
	});

	it("closes on Escape, which is the only exit a keyboard has", () => {
		viewport.isMobile = true;
		const { getByRole, queryByRole } = render(<MobileHarness />);
		fireEvent.click(getByRole("button", { name: "Toggle sidebar" }));

		act(() => {
			fireEvent.keyDown(window, { key: "Escape" });
		});

		expect(queryByRole("dialog")).toBeNull();
		viewport.isMobile = false;
	});

	it("hands focus back to the trigger on close, so the tab order does not restart", () => {
		viewport.isMobile = true;
		const { getByRole, queryByRole } = render(<MobileHarness />);
		const trigger = getByRole("button", { name: "Toggle sidebar" });
		trigger.focus();
		fireEvent.click(trigger);

		act(() => {
			fireEvent.keyDown(window, { key: "Escape" });
		});

		expect(queryByRole("dialog")).toBeNull();
		expect(document.activeElement).toBe(trigger);
		viewport.isMobile = false;
	});
});

const StateHarness = ({ children }: { children?: ReactNode }) => {
	const { state, open, openMobile } = useSidebar();
	return (
		<span data-testid="state" data-state={state} data-open={String(open)} data-open-mobile={String(openMobile)}>
			{children}
		</span>
	);
};

const readState = (view: ReturnType<typeof render>) => view.getByTestId("state").dataset;

describe("the rail remembers whether it was collapsed", () => {
	it("reopens collapsed when that is what the cookie says", () => {
		vi.spyOn(document, "cookie", "get").mockReturnValue("sidebar_state=false");

		const view = render(
			<SidebarProvider>
				<StateHarness />
			</SidebarProvider>,
		);

		expect(readState(view).state).toBe("collapsed");
		vi.restoreAllMocks();
	});

	it("finds its own cookie among the others rather than only as the first", () => {
		vi.spyOn(document, "cookie", "get").mockReturnValue("NEXT_LOCALE=en; sidebar_state=false; user-country=ES");

		const view = render(
			<SidebarProvider>
				<StateHarness />
			</SidebarProvider>,
		);

		expect(readState(view).state).toBe("collapsed");
		vi.restoreAllMocks();
	});

	it("stays open on any value that is not the word false", () => {
		vi.spyOn(document, "cookie", "get").mockReturnValue("sidebar_state=true");

		const view = render(
			<SidebarProvider>
				<StateHarness />
			</SidebarProvider>,
		);

		expect(readState(view).state).toBe("expanded");
		vi.restoreAllMocks();
	});

	it("leaves a caller that owns the state alone, cookie or no cookie", () => {
		vi.spyOn(document, "cookie", "get").mockReturnValue("sidebar_state=false");

		const view = render(
			<SidebarProvider open onOpenChange={vi.fn()}>
				<StateHarness />
			</SidebarProvider>,
		);

		expect(readState(view).state).toBe("expanded");
		vi.restoreAllMocks();
	});
});

describe("the keyboard shortcut", () => {
	const renderShortcutHarness = () =>
		render(
			<SidebarProvider>
				<StateHarness />
			</SidebarProvider>,
		);

	it("collapses the rail on the modifier and the key together", () => {
		const view = renderShortcutHarness();

		act(() => {
			fireEvent.keyDown(window, { key: "b", metaKey: true });
		});

		expect(readState(view).state).toBe("collapsed");
	});

	it("takes the control key too, since not every keyboard has a command key", () => {
		const view = renderShortcutHarness();

		act(() => {
			fireEvent.keyDown(window, { key: "b", ctrlKey: true });
		});

		expect(readState(view).state).toBe("collapsed");
	});

	it("leaves a bare press of the same key alone, so typing is not a shortcut", () => {
		const view = renderShortcutHarness();

		act(() => {
			fireEvent.keyDown(window, { key: "b" });
		});

		expect(readState(view).state).toBe("expanded");
	});

	it("opens the drawer rather than the rail on a phone", () => {
		viewport.isMobile = true;
		const view = renderShortcutHarness();

		act(() => {
			fireEvent.keyDown(window, { key: "b", metaKey: true });
		});

		expect(readState(view).openMobile).toBe("true");
		expect(readState(view).state).toBe("expanded");
		viewport.isMobile = false;
	});

	it("tells a caller that owns the state instead of writing its own", () => {
		const onOpenChange = vi.fn();
		render(
			<SidebarProvider open onOpenChange={onOpenChange}>
				<StateHarness />
			</SidebarProvider>,
		);

		act(() => {
			fireEvent.keyDown(window, { key: "b", metaKey: true });
		});

		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	});

	it("stops listening once the provider goes away", () => {
		const { unmount } = renderShortcutHarness();

		unmount();

		expect(() => fireEvent.keyDown(window, { key: "b", metaKey: true })).not.toThrow();
	});
});

describe("a menu button in a collapsed rail", () => {
	const renderMenu = ({ defaultOpen = true, tooltip }: { defaultOpen?: boolean; tooltip?: string } = {}) => {
		const onClick = vi.fn();
		const view = render(
			<SidebarProvider defaultOpen={defaultOpen}>
				<StateHarness />
				<SidebarMenuButton tooltip={tooltip} onClick={onClick}>
					Countries
				</SidebarMenuButton>
			</SidebarProvider>,
		);
		return { ...view, onClick };
	};

	it("opens the rail before it forwards the click, so the control it just revealed is usable", () => {
		const view = renderMenu({ defaultOpen: false });

		fireEvent.click(view.getByRole("button", { name: "Countries" }));

		expect(readState(view).state).toBe("expanded");
		expect(view.onClick).toHaveBeenCalledOnce();
	});

	it("leaves an already open rail alone and just forwards", () => {
		const view = renderMenu();

		fireEvent.click(view.getByRole("button", { name: "Countries" }));

		expect(readState(view).state).toBe("expanded");
		expect(view.onClick).toHaveBeenCalledOnce();
	});

	it("does not reach for the rail on a phone, where there is none to open", () => {
		viewport.isMobile = true;
		const view = renderMenu({ defaultOpen: false });

		fireEvent.click(view.getByRole("button", { name: "Countries" }));

		expect(readState(view).state).toBe("collapsed");
		expect(view.onClick).toHaveBeenCalledOnce();
		viewport.isMobile = false;
	});

	it("names itself with a tooltip once the rail is collapsed and the label is gone", () => {
		const view = renderMenu({ defaultOpen: false, tooltip: "Countries" });

		expect(view.getAllByText("Countries")).toHaveLength(2);
	});

	it("needs no tooltip while the label is on screen", () => {
		const view = renderMenu({ defaultOpen: true, tooltip: "Countries" });

		expect(view.getAllByText("Countries")).toHaveLength(1);
	});

	it("needs none on a phone either, where a tooltip has nothing to hover", () => {
		viewport.isMobile = true;
		const view = renderMenu({ defaultOpen: false, tooltip: "Countries" });

		expect(view.getAllByText("Countries")).toHaveLength(1);
		viewport.isMobile = false;
	});
});
