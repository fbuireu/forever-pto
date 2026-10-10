import { getCountries } from "@infrastructure/services/countries/getCountries";
import { cn } from "@ui/utils/cn";
import { getCurrentYear } from "@ui/utils/getCurrentYear";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { InlineQuickStartClient } from "../quick-start/InlineQuickStartClient";
import { brutCard } from "./shared";

const TITLE_ID = "inline-quick-start-title";

interface InlineQuickStartProps {
	locale: Locale;
}

export const InlineQuickStart = async ({ locale }: InlineQuickStartProps) => {
	const [t, serverYear] = await Promise.all([getTranslations("homepage"), getCurrentYear()]);

	return (
		<section className="px-7 pb-20" id="plan" aria-labelledby={TITLE_ID}>
			<div className={cn(brutCard, "max-w-[1240px] mx-auto p-6 md:p-8")}>
				<h2
					id={TITLE_ID}
					className="font-display font-semibold leading-none tracking-[-0.03em] mb-2 text-[clamp(26px,3vw,36px)]"
				>
					{t("inlineQuickStart.title")}
				</h2>
				<p className="text-muted-foreground mb-6">{t("inlineQuickStart.description")}</p>
				<InlineQuickStartClient countries={getCountries(locale)} serverYear={serverYear} />
			</div>
		</section>
	);
};
