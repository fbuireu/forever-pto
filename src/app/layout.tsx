import { THEME_STORAGE_KEY } from "@const/const";
import type { I18nConfig } from "@const/types";
import { ErrorBoundary } from "@modules/components/core/errorBoundary/ErrorBoundary";
import { KofiWidget } from "@modules/components/core/kofiWidget/KofiWidget";
import "@styles/index.css";
import { Analytics } from "@ui/modules/components/core/analytics/Analytics";
import { ThemeProvider } from "@ui/providers/theme/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
} as const);

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
} as const);


export type RootLayoutProps = Readonly<{
	children: ReactNode;
}>;

const RootLayout = async ({ children }: RootLayoutProps) => {
	return (
		<ErrorBoundary>
			<html lang={"en"} className={geistSans.className}>
				<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							storageKey={THEME_STORAGE_KEY}
							enableSystem
							disableTransitionOnChange
						>
							<main>{children}</main>
						</ThemeProvider>
						<Analytics />
				</body>
			</html>
		</ErrorBoundary>
	);
};

export default RootLayout;
