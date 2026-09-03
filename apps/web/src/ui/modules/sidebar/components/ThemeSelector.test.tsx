import en from "@i18n/messages/en.json";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const theme = vi.hoisted(() => ({ theme: "dark", themes: ["light", "dark", "system"], setTheme: vi.fn() }));

vi.mock("next-themes", () => ({ useTheme: () => theme }));

vi.mock("@ui/modules/core/animate/base/DropdownMenu", () => ({
	DropdownMenu: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children }: { children?: ReactNode }) => children,
	DropdownMenuContent: ({ children }: { children?: ReactNode }) => <div data-testid="menu">{children}</div>,
	DropdownMenuItem: ({ children, onClick }: ComponentProps<"button">) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock("@ui/modules/core/animate/icons/Icon", () => ({
	AnimateIcon: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@ui/modules/core/animate/icons/Check", () => ({ Check: () => <svg data-testid="check" /> }));
vi.mock("@ui/modules/core/animate/icons/Moon", () => ({ Moon: () => <svg /> }));
vi.mock("@ui/modules/core/animate/icons/Sun", () => ({ Sun: () => <svg /> }));

const { ThemeSelector } = await import("./ThemeSelector");

const renderSelector = (buttonClassName?: string) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<ThemeSelector buttonClassName={buttonClassName} />
		</NextIntlClientProvider>,
	);

const trigger = () => screen.getByRole("button", { name: en.theme.toggleTheme });

const item = (label: string) => within(screen.getByTestId("menu")).getByRole("button", { name: label });

beforeEach(() => {
	theme.theme = "dark";
	theme.setTheme.mockClear();
});

describe("ThemeSelector", () => {
	it("names the trigger for a screen reader, since it shows only icons", () => {
		renderSelector();

		expect(trigger()).toBeTruthy();
	});

	it("offers every theme next-themes reports, translated", () => {
		renderSelector();

		expect(
			within(screen.getByTestId("menu"))
				.getAllByRole("button")
				.map((b) => b.textContent),
		).toStrictEqual([en.theme.light, en.theme.dark, en.theme.system]);
	});

	it("marks the theme in force and only that one", () => {
		renderSelector();

		expect(within(item(en.theme.dark)).getByTestId("check")).toBeTruthy();
		expect(within(item(en.theme.light)).queryByTestId("check")).toBeNull();
		expect(within(item(en.theme.system)).queryByTestId("check")).toBeNull();
	});

	it("hands next-themes the theme that was picked, by its own name", async () => {
		renderSelector();

		await userEvent.click(item(en.theme.light));

		expect(theme.setTheme).toHaveBeenCalledExactlyOnceWith("light");
	});

	it("fills the rail by default", () => {
		renderSelector();

		expect(trigger().className).toContain("w-full");
	});

	it("takes the caller's trigger class instead when one is given", () => {
		renderSelector("size-9");

		expect(trigger().className).toContain("size-9");
		expect(trigger().className).not.toContain("w-full");
	});
});
