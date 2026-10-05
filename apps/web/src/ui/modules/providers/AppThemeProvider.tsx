"use client";

import { type Attribute, ThemeProvider } from "next-themes";
import type { ComponentProps } from "react";

const THEME_ATTRIBUTES: Attribute[] = ["data-theme", "class"];

type AppThemeProviderProps = Pick<ComponentProps<typeof ThemeProvider>, "children">;

export function AppThemeProvider({ children }: AppThemeProviderProps) {
	return (
		<ThemeProvider
			attribute={THEME_ATTRIBUTES}
			defaultTheme="light"
			storageKey="theme"
			enableSystem
			disableTransitionOnChange
		>
			{children}
		</ThemeProvider>
	);
}
