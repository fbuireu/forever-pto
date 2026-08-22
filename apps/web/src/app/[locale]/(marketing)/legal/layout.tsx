import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

interface LegalLayoutProps {
	children: ReactNode;
	params: Promise<{ locale: Locale }>;
}

const LegalLayout = async ({ children, params }: Readonly<LegalLayoutProps>) => {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<main id="main-content" className="flex-1">
			{children}
		</main>
	);
};

export default LegalLayout;
