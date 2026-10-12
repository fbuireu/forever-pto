import { resolveLocale } from "@infrastructure/i18n/utils/url";
import { Toaster } from "@ui/modules/core/primitives/Sonner";
import { QuickStart } from "@ui/modules/pages/homepage/quick-start/QuickStart";
import { Footer } from "@ui/modules/shared/footer/Footer";
import { Header } from "@ui/modules/shared/Header";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

interface MarketingLayoutProps {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}

const MarketingLayout = async ({ children, params }: Readonly<MarketingLayoutProps>) => {
	const locale = resolveLocale((await params).locale);
	setRequestLocale(locale);
	const tA11y = await getTranslations({ locale, namespace: "a11y" });

	return (
		<div className="min-h-screen flex flex-col text-foreground bg-background">
			<Header />
			{children}
			<Footer />
			<Toaster closeLabel={tA11y("closeToast")} />
			<QuickStart locale={locale} />
		</div>
	);
};

export default MarketingLayout;
