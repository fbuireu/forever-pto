import { readFileSync } from "node:fs";
import { join } from "node:path";
import enMessages from "@i18n/messages/en.json";
import { type RenderResult, render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("./QuickStartTrigger", () => ({
	QuickStartTrigger: ({ children, source }: { children: ReactNode; source: string }) => (
		<button type="button" data-testid="quick-start-trigger" data-source={source}>
			{children}
		</button>
	),
}));
vi.mock("./ThemeSelector", () => ({
	ThemeSelector: ({ buttonClassName }: { buttonClassName?: string }) => (
		<button type="button" data-testid="theme" className={buttonClassName}>
			theme
		</button>
	),
}));
vi.mock("./HomepageLanguageSwitcher", () => ({
	HomepageLanguageSwitcher: () => (
		<button type="button" data-testid="language">
			language
		</button>
	),
}));
vi.mock("next/image", () => ({ default: () => null }));

import { Header } from "./Header";

const nav = enMessages.homepage.nav;

const renderHeader = async (): Promise<RenderResult> => {
	mockGetTranslations.mockResolvedValue(
		createTranslator({ locale: "en", messages: enMessages, namespace: "homepage" }),
	);
	return render(await Header());
};

describe("Header", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("names the brand link, since its logo image is decorative", async () => {
		await renderHeader();

		expect(screen.getByRole("link", { name: "Forever PTO" }).getAttribute("href")).toBe("/");
	});

	it("anchors each section link to the homepage fragment it scrolls to", async () => {
		await renderHeader();

		expect(screen.getByRole("link", { name: nav.how }).getAttribute("href")).toBe("/#how");
		expect(screen.getByRole("link", { name: nav.features }).getAttribute("href")).toBe("/#features");
		expect(screen.getByRole("link", { name: nav.pricing }).getAttribute("href")).toBe("/#pricing");
	});

	it("opens the quick start from the trial action rather than linking straight into the planner", async () => {
		await renderHeader();

		expect(screen.getByTestId("quick-start-trigger").getAttribute("data-source")).toBe("nav");
		expect(screen.getByTestId("quick-start-trigger").textContent).toBe(nav.trialAction);
		expect(screen.queryByRole("link", { name: nav.trialAction })).toBeNull();
	});

	it("places the theme and language controls inside the navigation landmark", async () => {
		await renderHeader();
		const landmark = screen.getByRole("navigation");

		expect(landmark.contains(screen.getByTestId("theme"))).toBe(true);
		expect(landmark.contains(screen.getByTestId("language"))).toBe(true);
	});
});

describe("Header's imports", () => {
	it("reaches into no screen's folder, since every screen that renders it may import it", () => {
		const source = readFileSync(join(__dirname, "Header.tsx"), "utf8");

		expect(source).not.toMatch(/modules\/pages\/|\.\.\/pages\//);
	});
});

describe("Header safe areas", () => {
	it("pads its own top by the status bar while it sticks, so its background reaches the edge and its controls clear it", async () => {
		const { container } = await renderHeader();
		const nav = container.querySelector("nav");

		expect(nav?.className).toContain("sticky");
		expect(nav?.className).toContain("top-0");
		expect(nav?.className).toContain("pt-[env(safe-area-inset-top)]");
	});

	it("keeps its row off the landscape notch", async () => {
		const { container } = await renderHeader();
		const classes = (container.querySelector("nav > div")?.className ?? "").split(" ");

		expect(classes).toContain("px-safe-7");
	});
});
