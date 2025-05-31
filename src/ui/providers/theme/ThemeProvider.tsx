"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const getThemeProvider = async () => {
	const { ThemeProvider } = await import("next-themes");
	return ThemeProvider;
};

const NextThemesProvider = dynamic(() => getThemeProvider(), { ssr: false });

export function ThemeProvider({ children, ...props }: Readonly<ComponentProps<typeof NextThemesProvider>>) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
