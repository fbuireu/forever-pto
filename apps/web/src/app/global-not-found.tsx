import "@styles/index.css";
import { clientMessagesOf } from "@infrastructure/i18n/clientMessages";
import { routing } from "@infrastructure/i18n/routing";
import { notFoundTitle } from "@infrastructure/seo/notFoundMetadata";
import { LazyMotionProvider } from "@ui/modules/core/animate/providers/LazyMotionProvider";
import { SkipToContent } from "@ui/modules/layout/SkipToContent";
import { QuickStart } from "@ui/modules/pages/homepage/quick-start/QuickStart";
import { NotFoundContent } from "@ui/modules/pages/not-found/NotFoundContent";
import { AppThemeProvider } from "@ui/modules/providers/AppThemeProvider";
import { Footer } from "@ui/modules/shared/footer/Footer";
import { Header } from "@ui/modules/shared/Header";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { DOCUMENT_BODY_CLASS } from "./fonts";

const DEFAULT_LOCALE = routing.defaultLocale;

export const generateMetadata = () => notFoundTitle(DEFAULT_LOCALE);

export default async function GlobalNotFound() {
	setRequestLocale(DEFAULT_LOCALE);
	const [t, messages] = await Promise.all([
		getTranslations({ locale: DEFAULT_LOCALE, namespace: "a11y" }),
		getMessages({ locale: DEFAULT_LOCALE }),
	]);

	return (
		<html lang={DEFAULT_LOCALE} suppressHydrationWarning>
			<body className={DOCUMENT_BODY_CLASS}>
				<SkipToContent label={t("skipToMainContent")} />
				<NextIntlClientProvider locale={DEFAULT_LOCALE} messages={clientMessagesOf(messages)}>
					<AppThemeProvider>
						<LazyMotionProvider>
							<div className="min-h-screen flex flex-col text-foreground bg-background">
								<Header />
								<NotFoundContent locale={DEFAULT_LOCALE} />
								<Footer />
								<QuickStart locale={DEFAULT_LOCALE} />
							</div>
						</LazyMotionProvider>
					</AppThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
