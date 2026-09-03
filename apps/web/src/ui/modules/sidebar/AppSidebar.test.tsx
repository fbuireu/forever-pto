import { render, screen, within } from "@testing-library/react";
import { MAIN_CONTENT_ID } from "@ui/modules/layout/SkipToContent";
import { TUTORIAL_ANCHOR } from "@ui/modules/tutorial/anchors";
import type { Locale } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

interface CollapsibleGroupProps {
	defaultOpen?: boolean;
	trigger: ReactNode;
	children: ReactNode;
	"data-tutorial"?: string;
}

vi.mock("next-intl/server", () => ({
	getTranslations: async (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock("@ui/utils/getCurrentYear", () => ({ getCurrentYear: async () => 2026 }));

vi.mock("next/dynamic", () => ({
	default: (loader: () => Promise<unknown>) => {
		const name = /components\/(\w+)/.exec(loader.toString())?.[1] ?? "unknown";
		return (props: Record<string, unknown>) => <div data-dynamic={name} data-props={JSON.stringify(props)} />;
	},
}));

vi.mock("@ui/modules/core/animate/base/Sidebar", () => ({
	Sidebar: ({ children, landmarkLabel }: { children?: ReactNode; landmarkLabel?: string }) => (
		<aside aria-label={landmarkLabel}>{children}</aside>
	),
	SidebarContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	SidebarGroup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	SidebarGroupLabel: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
	SidebarHeader: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	SidebarInset: ({ children, ...props }: ComponentProps<"div">) => <main {...props}>{children}</main>,
	SidebarMenu: ({ children }: { children?: ReactNode }) => <ul>{children}</ul>,
	SidebarMenuButton: ({ children, tooltip }: { children?: ReactNode; tooltip?: string }) => (
		<button type="button" title={tooltip}>
			{children}
		</button>
	),
	SidebarMenuItem: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
	SidebarTrigger: ({ label }: { label?: string }) => <button type="button" aria-label={label} />,
}));

vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@ui/modules/core/animate/icons/ChevronDown", () => ({ ChevronDown: () => <svg /> }));
vi.mock("@ui/modules/core/animate/icons/Settings", () => ({ Settings: () => <svg /> }));
vi.mock("@ui/modules/shared/Logo", () => ({ Logo: () => <div data-testid="logo" /> }));

vi.mock("./components/Countries", () => ({
	Countries: ({ locale }: { locale: string }) => <div data-testid="countries" data-locale={locale} />,
}));
vi.mock("./components/PtoDays", () => ({ PtoDays: () => <div data-testid="pto-days" /> }));
vi.mock("./components/SidebarFooterButtons", () => ({
	SidebarFooterButtons: () => <div data-testid="footer-buttons" />,
}));
vi.mock("./components/SidebarCollapsibleGroup", () => ({
	SidebarCollapsibleGroup: ({ defaultOpen = false, trigger, children, ...props }: CollapsibleGroupProps) => (
		<div data-group data-tutorial={props["data-tutorial"]} data-default-open={String(defaultOpen)}>
			{trigger}
			{children}
		</div>
	),
}));

const { AppSidebar } = await import("./AppSidebar");

const renderSidebar = async () => {
	const element = await AppSidebar({ locale: "en" as Locale, children: <p>page content</p> });
	return render(element);
};

const dynamicProps = (name: string) => {
	const node = document.querySelector(`[data-dynamic="${name}"]`);
	return JSON.parse(node?.getAttribute("data-props") ?? "null");
};

describe("AppSidebar", () => {
	it("labels the landmark from the a11y bundle rather than the sidebar one", async () => {
		await renderSidebar();

		expect(screen.getByRole("complementary", { name: "a11y.sidebarLandmark" })).toBeTruthy();
	});

	it("heads the configuration and the tools groups so assistive tech can jump between them", async () => {
		await renderSidebar();

		expect(screen.getByRole("heading", { level: 2, name: "sidebar.configuration" })).toBeTruthy();
		expect(screen.getByRole("heading", { level: 2, name: "sidebar.tools" })).toBeTruthy();
	});

	it("anchors the four steps and the tools group for the tutorial, in tour order", async () => {
		const { container } = await renderSidebar();

		const anchors = [...container.querySelectorAll("[data-tutorial]")].map((node) =>
			node.getAttribute("data-tutorial"),
		);

		expect(anchors).toStrictEqual([
			TUTORIAL_ANCHOR.SIDEBAR_STEP_1,
			TUTORIAL_ANCHOR.SIDEBAR_STEP_2,
			TUTORIAL_ANCHOR.SIDEBAR_STEP_3,
			TUTORIAL_ANCHOR.SIDEBAR_STEP_4,
			TUTORIAL_ANCHOR.SIDEBAR_TOOLS,
		]);
	});

	it("opens the steps on first paint and keeps the calculators folded", async () => {
		const { container } = await renderSidebar();

		const groups = [...container.querySelectorAll("[data-group]")].map((node) =>
			node.getAttribute("data-default-open"),
		);

		expect(groups).toStrictEqual(["true", "false"]);
	});

	it("numbers each step card in its own heading", async () => {
		await renderSidebar();

		for (const step of [1, 2, 3, 4]) {
			const heading = screen.getByRole("heading", { level: 3, name: new RegExp(`sidebar.step${step}\\.badge`) });
			expect(heading.textContent).toContain(`sidebar.step${step}.titleStart`);
		}
	});

	it("hands the same current year to both components that draw a window around it", async () => {
		await renderSidebar();

		expect(dynamicProps("Years")).toStrictEqual({ currentYear: 2026 });
		expect(dynamicProps("PtoCalculator")).toStrictEqual({ currentYear: 2026 });
	});

	it("hands the locale down to Countries instead of letting it read the request", async () => {
		await renderSidebar();

		expect(screen.getByTestId("countries").dataset.locale).toBe("en");
	});

	it("mounts every control the tour anchors, one per step", async () => {
		await renderSidebar();

		const [step1, step2, step3, step4] = [1, 2, 3, 4].map(
			(step) => document.querySelector(`[data-tutorial="sidebar-step-${step}"]`) as HTMLElement,
		);

		expect(within(step1).getByTestId("countries")).toBeTruthy();
		expect(step1.querySelectorAll("[data-dynamic]")).toHaveLength(2);
		expect(within(step2).getByTestId("pto-days")).toBeTruthy();
		expect([...step3.querySelectorAll("[data-dynamic]")].map((n) => n.getAttribute("data-dynamic"))).toStrictEqual([
			"Strategy",
			"AllowPastDays",
			"CarryOverMonths",
		]);
		expect(step4.querySelector('[data-dynamic="CalendarExport"]')).toBeTruthy();
	});

	it("puts the three calculators under the tools anchor", async () => {
		await renderSidebar();

		const tools = document.querySelector(`[data-tutorial="${TUTORIAL_ANCHOR.SIDEBAR_TOOLS}"]`) as HTMLElement;

		expect([...tools.querySelectorAll("[data-dynamic]")].map((n) => n.getAttribute("data-dynamic"))).toStrictEqual([
			"PtoCalculator",
			"PtoSalaryCalculator",
			"WorkdayCounter",
		]);
	});

	it("renders the page inside the landmark the skip link targets, focusable but out of the tab order", async () => {
		await renderSidebar();

		const main = screen.getByRole("main");

		expect(main.id).toBe(MAIN_CONTENT_ID);
		expect(main.tabIndex).toBe(-1);
		expect(within(main).getByText("page content")).toBeTruthy();
	});

	it("labels the sidebar toggle from the a11y bundle", async () => {
		await renderSidebar();

		expect(screen.getByRole("button", { name: "a11y.toggleSidebar" })).toBeTruthy();
	});

	it("mounts the footer buttons and the logo inside the rail", async () => {
		await renderSidebar();

		const rail = screen.getByRole("complementary");

		expect(within(rail).getByTestId("footer-buttons")).toBeTruthy();
		expect(within(rail).getByTestId("logo")).toBeTruthy();
	});
});
