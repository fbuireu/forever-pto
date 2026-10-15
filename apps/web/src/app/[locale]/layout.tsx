import { clientMessagesOf } from "@infrastructure/i18n/clientMessages";
import { LOCALES, type LocaleCode } from "@infrastructure/i18n/locales";
import { resolveLocale } from "@infrastructure/i18n/utils/url";
import { BonesProvider } from "@ui/modules/providers/BonesProvider";
import { StripePreload } from "@ui/modules/providers/StripePreload";
import { CookieConsentClient } from "@ui/modules/shared/cookie-consent/CookieConsentClient";
import { WebMCP } from "@ui/modules/shared/WebMCP";
import { type ReactNode, Suspense } from "react";
import "@styles/index.css";
import { DOCUMENT_BODY_CLASS } from "@app/fonts";
import { LazyMotionProvider } from "@ui/modules/core/animate/providers/LazyMotionProvider";
import { SkipToContent } from "@ui/modules/layout/SkipToContent";
import { AppThemeProvider } from "@ui/modules/providers/AppThemeProvider";
import { Analytics } from "@ui/modules/tracking/Analytics";
import { BetterStackTracking } from "@ui/modules/tracking/BetterStackTracking";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

interface LayoutProps {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}

export function generateStaticParams(): { locale: LocaleCode }[] {
	return LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

const Layout = async ({ children, params }: Readonly<LayoutProps>) => {
	const locale = resolveLocale((await params).locale);
	setRequestLocale(locale);
	const [t, messages] = await Promise.all([getTranslations("a11y"), getMessages()]);

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={DOCUMENT_BODY_CLASS}>
				<SkipToContent label={t("skipToMainContent")} />
				<BonesProvider />
				<StripePreload />
				<NextIntlClientProvider messages={clientMessagesOf(messages)}>
					<AppThemeProvider>
						<LazyMotionProvider>
							{children}
							<CookieConsentClient />
						</LazyMotionProvider>
					</AppThemeProvider>
				</NextIntlClientProvider>
				<WebMCP />
				<Analytics />
				<Suspense fallback={null}>
					<BetterStackTracking />
				</Suspense>
			</body>
		</html>
	);
};

export default Layout;
