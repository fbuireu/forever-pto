import "@styles/index.css";
import { THEME_STORAGE_KEY } from "@const/const";
import { ErrorBoundary } from "@modules/components/core/errorBoundary/ErrorBoundary";
import { Footer } from "@ui/modules/components/core/footer/Footer";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
} as const);

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
} as const);

export const metadata: Metadata = {
	title: "Forever PTO - Optimiza tus días libres",
	description: "Aplicación para optimizar la selección de días PTO y maximizar tu tiempo libre",
} as const;

type RootLayoutProps = Readonly<{ children: ReactNode }>;

const RootLayout = ({ children }: RootLayoutProps) => (
	<ErrorBoundary>
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					storageKey={THEME_STORAGE_KEY}
					enableSystem
					disableTransitionOnChange
				>
					<main>{children}</main>
					<Footer />
				</ThemeProvider>
			</body>
		</html>
	</ErrorBoundary>
);

export default RootLayout;
