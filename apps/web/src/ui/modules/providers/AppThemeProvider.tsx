"use client";

import { ThemeProvider } from "next-themes";
import type { ComponentProps } from "react";

type AppThemeProviderProps = Pick<ComponentProps<typeof ThemeProvider>, "children">;

export function AppThemeProvider({ children }: AppThemeProviderProps) {
	return (
		<ThemeProvider
			attribute="data-theme"
			defaultTheme="light"
			storageKey="theme"
			enableSystem
			disableTransitionOnChange
		>
			{children}
		</ThemeProvider>
	);
}
