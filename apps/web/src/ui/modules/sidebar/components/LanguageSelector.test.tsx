import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Español" },
];

const languageSwitch = vi.hoisted(() => ({
	locale: "en",
	selectLanguage: vi.fn(),
	switcherLabel: "Select language, current: English",
}));

const sidebar = vi.hoisted(() => ({ state: "expanded" }));

vi.mock("@ui/hooks/useLanguageSwitch", () => ({
	useLanguageSwitch: () => ({
		...languageSwitch,
		languages: LANGUAGES,
		currentLanguage: LANGUAGES.find(({ code }) => code === languageSwitch.locale),
	}),
}));

vi.mock("@ui/modules/core/animate/base/Sidebar", () => ({ useSidebar: () => sidebar }));

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

const { LanguageSelector } = await import("./LanguageSelector");

const trigger = () => screen.getByRole("button", { name: languageSwitch.switcherLabel });

const item = (label: string) => within(screen.getByTestId("menu")).getByRole("button", { name: label });

beforeEach(() => {
	languageSwitch.locale = "en";
	languageSwitch.selectLanguage.mockClear();
	sidebar.state = "expanded";
});

describe("LanguageSelector", () => {
	it("names the trigger after the switch it performs and the language in force", () => {
		render(<LanguageSelector />);

		expect(trigger().getAttribute("aria-label")).toBe("Select language, current: English");
	});

	it("shows the full language name while the rail is expanded", () => {
		render(<LanguageSelector />);

		expect(trigger().textContent).toBe("English");
	});

	it("shows only the code once the rail has collapsed to icons", () => {
		sidebar.state = "collapsed";

		render(<LanguageSelector />);

		expect(trigger().textContent).toBe("en");
	});

	it("offers every language the hook knows, in its order", () => {
		render(<LanguageSelector />);

		expect(
			within(screen.getByTestId("menu"))
				.getAllByRole("button")
				.map((b) => b.textContent),
		).toStrictEqual(["English", "Español"]);
	});

	it("marks the language in force and only that one", () => {
		languageSwitch.locale = "es";

		render(<LanguageSelector />);

		expect(within(item("Español")).getByTestId("check")).toBeTruthy();
		expect(within(item("English")).queryByTestId("check")).toBeNull();
	});

	it("switches to the language that was picked, by its code", async () => {
		render(<LanguageSelector />);

		await userEvent.click(item("Español"));

		expect(languageSwitch.selectLanguage).toHaveBeenCalledExactlyOnceWith("es");
	});
});
