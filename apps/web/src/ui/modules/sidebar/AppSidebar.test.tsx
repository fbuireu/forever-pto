import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen, within } from "@testing-library/react";
import { MAIN_CONTENT_ID } from "@ui/modules/layout/SkipToContent";
import { TUTORIAL_ANCHOR } from "@ui/modules/tutorial/anchors";
import { createTranslator, type Locale } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface CollapsibleGroupProps {
	defaultOpen?: boolean;
	icon: ReactNode;
	label: string;
	tooltip: string;
	children: ReactNode;
	"data-tutorial"?: string;
}

const { mockGetTranslations, loaders, lazy } = vi.hoisted(() => ({
	mockGetTranslations: vi.fn(),
	loaders: new Map<string, () => Promise<unknown>>(),
	lazy: {
		Regions: () => null,
		Years: () => null,
		Strategy: () => null,
		AllowPastDays: () => null,
		CarryOverMonths: () => null,
		PtoCalculator: () => null,
		PtoSalaryCalculator: () => null,
		WorkdayCounter: () => null,
		CalendarExport: () => null,
	},
}));

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));

vi.mock("@ui/utils/getCurrentYear", () => ({ getCurrentYear: async () => 2026 }));

vi.mock("next/dynamic", () => ({
	default: (loader: () => Promise<unknown>) => {
		const name = /components\/(\w+)/.exec(loader.toString())?.[1] ?? "unknown";
		loaders.set(name, loader);
		return (props: Record<string, unknown>) => <div data-dynamic={name} data-props={JSON.stringify(props)} />;
	},
}));

vi.mock("./components/Regions", () => ({ Regions: lazy.Regions }));
vi.mock("./components/Years", () => ({ Years: lazy.Years }));
vi.mock("./components/Strategy", () => ({ Strategy: lazy.Strategy }));
vi.mock("./components/AllowPastDays", () => ({ AllowPastDays: lazy.AllowPastDays }));
vi.mock("./components/CarryOverMonths", () => ({ CarryOverMonths: lazy.CarryOverMonths }));
vi.mock("./components/PtoCalculator", () => ({ PtoCalculator: lazy.PtoCalculator }));
vi.mock("./components/PtoSalaryCalculator", () => ({ PtoSalaryCalculator: lazy.PtoSalaryCalculator }));
vi.mock("./components/WorkdayCounter", () => ({ WorkdayCounter: lazy.WorkdayCounter }));
vi.mock("./components/CalendarExport", () => ({ CalendarExport: lazy.CalendarExport }));

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
	SidebarMenuItem: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
	SidebarTrigger: ({ label }: { label?: string }) => <button type="button" aria-label={label} />,
}));

vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => children,
}));
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
	SidebarCollapsibleGroup: ({
		defaultOpen = false,
		icon,
		label,
		tooltip,
		children,
		...props
	}: CollapsibleGroupProps) => (
		<div
			data-group
			data-tutorial={props["data-tutorial"]}
			data-default-open={String(defaultOpen)}
			data-label={label}
			data-tooltip={tooltip}
		>
			<span data-icon>{icon}</span>
			{children}
		</div>
	),
}));

const { AppSidebar } = await import("./AppSidebar");

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface TranslateInParams {
	locale: Locale;
	messages: typeof enMessages;
}

const translateIn = ({ locale, messages }: TranslateInParams) =>
	mockGetTranslations.mockImplementation(async (namespace: "sidebar" | "a11y") =>
		createTranslator({ locale, messages, namespace }),
	);

const renderSidebar = async () => {
	const element = await AppSidebar({ locale: "en" as Locale, children: <p>page content</p> });
	return render(element);
};

beforeEach(() => {
	translateIn({ locale: "en", messages: enMessages });
});

const dynamicProps = (name: string) => {
	const node = document.querySelector(`[data-dynamic="${name}"]`);
	return JSON.parse(node?.getAttribute("data-props") ?? "null");
};

describe("AppSidebar", () => {
	it("labels the landmark from the a11y bundle rather than the sidebar one", async () => {
		await renderSidebar();

		expect(screen.getByRole("complementary", { name: enMessages.a11y.sidebarLandmark })).toBeTruthy();
	});

	it("heads the configuration and the tools groups so assistive tech can jump between them", async () => {
		await renderSidebar();

		expect(screen.getByRole("heading", { level: 2, name: enMessages.sidebar.configuration })).toBeTruthy();
		expect(screen.getByRole("heading", { level: 2, name: enMessages.sidebar.tools })).toBeTruthy();
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

	it("hands each group its label and its tooltip as text, and never a trigger of its own to draw", async () => {
		const { container } = await renderSidebar();

		const groups = [...container.querySelectorAll<HTMLElement>("[data-group]")];

		expect(groups.map((group) => [group.dataset.label, group.dataset.tooltip])).toStrictEqual([
			[enMessages.sidebar.steps, enMessages.sidebar.steps],
			[enMessages.sidebar.calculators, enMessages.sidebar.tools],
		]);
		expect(container.querySelectorAll("[data-group] button")).toHaveLength(0);
	});

	it("hands each group an icon to draw inside its trigger", async () => {
		const { container } = await renderSidebar();

		const icons = [...container.querySelectorAll("[data-group] > [data-icon]")];

		expect(icons).toHaveLength(2);
		for (const icon of icons) expect(icon.querySelector("svg")).not.toBeNull();
	});

	it.each(Object.entries(BUNDLES))("labels both groups in %s from words the bundle has", async (locale, messages) => {
		translateIn({ locale: locale as Locale, messages });
		const { container } = await renderSidebar();

		for (const group of container.querySelectorAll<HTMLElement>("[data-group]")) {
			expect(group.dataset.label).toMatch(/\S/);
			expect(group.dataset.tooltip).toMatch(/\S/);
			expect(`${group.dataset.label}${group.dataset.tooltip}`).not.toMatch(/[<>{}]|sidebar\./);
		}
	});

	it("numbers each step card in its own heading, after the title drawn from one message", async () => {
		await renderSidebar();

		expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toStrictEqual([
			"Your contextstep 1",
			"Your daysstep 2",
			"Your configurationstep 3",
			"Your exportstep 4",
		]);
		expect(
			screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.querySelector("em")?.textContent),
		).toStrictEqual(["context", "days", "configuration", "export"]);
	});

	it.each(Object.entries(BUNDLES))("renders the %s step titles with their emphasis", async (locale, messages) => {
		translateIn({ locale: locale as Locale, messages });
		await renderSidebar();
		const headings = screen.getAllByRole("heading", { level: 3 });

		expect(headings).toHaveLength(4);
		for (const heading of headings) {
			expect(heading.querySelector("em")?.textContent).toMatch(/\S/);
			expect(heading.textContent).not.toMatch(/[<>{}]|sidebar\./);
		}
	});

	it("hands Years the year the server rendered with, and none to PtoCalculator, whose month names carry no year", async () => {
		await renderSidebar();

		expect(dynamicProps("Years")).toStrictEqual({ serverYear: 2026 });
		expect(dynamicProps("PtoCalculator")).toStrictEqual({});
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

		expect(screen.getByRole("button", { name: enMessages.a11y.toggleSidebar })).toBeTruthy();
	});

	it("resolves every lazy control to the component its module exports", async () => {
		await renderSidebar();

		expect([...loaders.keys()].toSorted()).toStrictEqual(Object.keys(lazy).toSorted());
		for (const [name, loader] of loaders) {
			expect(await loader()).toBe(lazy[name as keyof typeof lazy]);
		}
	});

	it("mounts the footer buttons and the logo inside the rail", async () => {
		await renderSidebar();

		const rail = screen.getByRole("complementary");

		expect(within(rail).getByTestId("footer-buttons")).toBeTruthy();
		expect(within(rail).getByTestId("logo")).toBeTruthy();
	});
});
