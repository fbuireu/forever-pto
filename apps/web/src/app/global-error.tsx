"use client";

import "@styles/index.css";

import { DOCUMENT_BODY_CLASS } from "@app/fonts";
import enMessages from "@i18n/messages/en.json";
import { EN } from "@infrastructure/i18n/locales";
import { getLocaleFromPathname } from "@infrastructure/i18n/utils/url";
import { LazyMotionProvider } from "@ui/modules/core/animate/providers/LazyMotionProvider";
import { ErrorContent } from "@ui/modules/pages/error/ErrorContent";
import type { ErrorBoundaryProps } from "@ui/modules/pages/error/types";
import { AppThemeProvider } from "@ui/modules/providers/AppThemeProvider";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
	const locale = getLocaleFromPathname(usePathname() ?? "");

	return (
		<html lang={EN} suppressHydrationWarning>
			<body className={DOCUMENT_BODY_CLASS}>
				<NextIntlClientProvider locale={locale} messages={enMessages}>
					<AppThemeProvider>
						<LazyMotionProvider>
							<div className="min-h-screen flex flex-col text-foreground bg-background">
								<ErrorContent error={error} reset={reset} />
							</div>
						</LazyMotionProvider>
					</AppThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
