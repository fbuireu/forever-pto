import { Toaster } from "@ui/modules/core/primitives/Sonner";
import { Header } from "@ui/modules/pages/homepage/navigation/Navigation";
import { Footer } from "@ui/modules/shared/footer/Footer";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

interface MarketingLayoutProps {
	children: ReactNode;
	params: Promise<{ locale: Locale }>;
}

const MarketingLayout = async ({ children, params }: Readonly<MarketingLayoutProps>) => {
	const { locale } = await params;
	setRequestLocale(locale);
	const tA11y = await getTranslations({ locale, namespace: "a11y" });

	return (
		<div className="min-h-screen flex flex-col text-foreground bg-background">
			<Header />
			{children}
			<Footer />
			<Toaster closeLabel={tA11y("closeToast")} />
		</div>
	);
};

export default MarketingLayout;
