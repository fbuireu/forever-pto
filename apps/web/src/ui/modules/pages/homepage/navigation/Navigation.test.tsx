import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@ui/modules/core/primitives/Button", () => ({
	Button: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@ui/modules/sidebar/components/ThemeSelector", () => ({
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

import { Header } from "./Navigation";

const nav = enMessages.homepage.nav;

const renderHeader = async () => {
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

	it("sends the trial action into the planner", async () => {
		await renderHeader();

		expect(screen.getByRole("link", { name: nav.trialAction }).getAttribute("href")).toBe("/planner");
	});

	it("places the theme and language controls inside the navigation landmark", async () => {
		await renderHeader();
		const landmark = screen.getByRole("navigation");

		expect(landmark.contains(screen.getByTestId("theme"))).toBe(true);
		expect(landmark.contains(screen.getByTestId("language"))).toBe(true);
	});
});
