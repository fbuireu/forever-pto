import { THEME_STORAGE_KEY } from "@const/const";
import { ErrorBoundary } from "@modules/components/core/errorBoundary/ErrorBoundary";
import "@styles/index.css";
import { Analytics } from "@ui/modules/components/core/analytics/Analytics";
import { ThemeProvider } from "@ui/providers/theme/ThemeProvider";
import { type Locale, NextIntlClientProvider } from "next-intl";
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
	params: Promise<{ locale: Locale }>;
}>;

const RootLayout = async ({ children, params }: RootLayoutProps) => {
	const { locale } = await params;

	return (
		<ErrorBoundary>
			<html lang={locale} className={geistSans.className}>
				<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
					<NextIntlClientProvider locale={locale}>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							storageKey={THEME_STORAGE_KEY}
							enableSystem
							disableTransitionOnChange
						>
							<main>{children}</main>
						</ThemeProvider>
						{/* <KofiWidget /> */}
						<Analytics />
					</NextIntlClientProvider>
				</body>
			</html>
		</ErrorBoundary>
	);
};

export default RootLayout;
