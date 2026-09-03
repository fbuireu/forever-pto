import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectLanguage = vi.hoisted(() => vi.fn());

vi.mock("@ui/hooks/useLanguageSwitch", () => ({
	useLanguageSwitch: () => ({
		locale: "en",
		languages: [
			{ code: "en", label: "English" },
			{ code: "de", label: "German" },
		],
		currentLanguage: { code: "en", label: "English" },
		selectLanguage,
		switcherLabel: "Select language, current: English",
	}),
}));
vi.mock("@ui/modules/core/animate/base/DropdownMenu", () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
	DropdownMenuContent: ({ children }: { children: ReactNode }) => <div role="menu">{children}</div>,
	DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
		<button type="button" role="menuitem" onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock("@ui/modules/core/animate/icons/Check", () => ({ Check: () => <span data-testid="check" /> }));
vi.mock("@ui/modules/core/primitives/Button", () => ({
	Button: ({ children, className, ...props }: ComponentProps<"button">) => (
		<button type="button" className={className} aria-label={props["aria-label"]}>
			{children}
		</button>
	),
}));

import { HomepageLanguageSwitcher } from "./HomepageLanguageSwitcher";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("HomepageLanguageSwitcher", () => {
	it("names the trigger after the language in force while showing its label", () => {
		render(<HomepageLanguageSwitcher />);
		const trigger = screen.getByRole("button", { name: "Select language, current: English" });

		expect(trigger.textContent).toBe("English");
	});

	it("switches to the language whose item was chosen", () => {
		render(<HomepageLanguageSwitcher />);

		fireEvent.click(screen.getByRole("menuitem", { name: "German" }));

		expect(selectLanguage).toHaveBeenCalledExactlyOnceWith("de");
	});

	it("marks only the current language with a check", () => {
		render(<HomepageLanguageSwitcher />);
		const checked = screen.getAllByRole("menuitem").filter((item) => item.querySelector('[data-testid="check"]'));

		expect(checked.map((item) => item.textContent)).toEqual(["English"]);
	});
});
