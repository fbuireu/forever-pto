import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("next-themes", () => ({
	ThemeProvider: ({ children, ...props }: { children: ReactNode }) => {
		captured.props = props;
		return <div data-testid="theme-provider">{children}</div>;
	},
}));

import { AppThemeProvider } from "./AppThemeProvider";

describe("AppThemeProvider", () => {
	it("writes the theme to the data attribute the stylesheet's selectors read, and to the class boneyard-js reads", () => {
		render(<AppThemeProvider>child</AppThemeProvider>);

		expect(captured.props).toMatchObject({ attribute: ["data-theme", "class"], storageKey: "theme" });
	});

	it("keeps the data attribute first, since it is the one the tokens and the dark variant key on", () => {
		render(<AppThemeProvider>child</AppThemeProvider>);

		expect((captured.props.attribute as string[])[0]).toBe("data-theme");
	});

	it("hands next-themes the same list on every render, so the script it memoises on that list is not redrawn", () => {
		const { rerender } = render(<AppThemeProvider>child</AppThemeProvider>);
		const first = captured.props.attribute;

		rerender(<AppThemeProvider>child again</AppThemeProvider>);

		expect(captured.props.attribute).toBe(first);
	});

	it("defaults to light while still following the system when the visitor asks for it", () => {
		render(<AppThemeProvider>child</AppThemeProvider>);

		expect(captured.props).toMatchObject({ defaultTheme: "light", enableSystem: true });
	});

	it("skips the transition on a switch, so every surface changes at once", () => {
		render(<AppThemeProvider>child</AppThemeProvider>);

		expect(captured.props.disableTransitionOnChange).toBe(true);
	});

	it("renders its children inside the provider", () => {
		render(<AppThemeProvider>child</AppThemeProvider>);

		expect(screen.getByTestId("theme-provider").textContent).toBe("child");
	});
});
