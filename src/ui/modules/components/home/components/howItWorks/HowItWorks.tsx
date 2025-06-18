import { Accordion } from "@modules/components/core/accordion/Accordion";
import { AccordionContent } from "@modules/components/core/accordion/atoms/accordionContent/AccordionContent";
import { AccordionItem } from "@modules/components/core/accordion/atoms/accordionItem/AccordionItem";
import { AccordionTrigger } from "@modules/components/core/accordion/atoms/accordionTrigger/AccordionTrigger";
import { CardContent } from "@modules/components/core/card/atoms/cardContent/CardContent";
import { CardDescription } from "@modules/components/core/card/atoms/cardDescription/CardDescription";
import { CardHeader } from "@modules/components/core/card/atoms/cardHeader/CardHeader";
import { CardTitle } from "@modules/components/core/card/atoms/cardTitle/CardTitle";
import { Card } from "@modules/components/core/card/Card";
import type { LocaleKey } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { getTranslations } from "next-intl/server";

interface HowItWorksProps {
	locale: LocaleKey;
}

export const HowItWorks = async ({ locale }: HowItWorksProps) => {
	const t = await getTranslations({ locale, namespace: "howItWorks" });

	const processItems = [
		{
			id: "block-generation",
			question: t("process.blockGeneration.title"),
			answer: (
				<div className="space-y-3">
					<p>{t("process.blockGeneration.steps.workdayAnalysis")}</p>
					<p>{t("process.blockGeneration.steps.sequenceCalculation")}</p>
					<p>{t("process.blockGeneration.steps.blockGeneration")}</p>
					<p>{t("process.blockGeneration.steps.scoring")}</p>
				</div>
			),
		},
		{
			id: "strategies",
			question: t("process.strategies.title"),
			answer: (
				<div className="space-y-3">
					<p>{t("process.strategies.description")}</p>
					<div className="pl-4 space-y-2">
						<p>{t("process.strategies.maxEffective")}</p>
						<p>{t("process.strategies.maxEfficiency")}</p>
						<p>{t("process.strategies.balanced")}</p>
					</div>
				</div>
			),
		},
		{
			id: "alternatives",
			question: t("process.alternatives.title"),
			answer: t("process.alternatives.description"),
		},
	];

	return (
		<section className="w-full max-w-4xl mx-auto">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Accordion type="single" collapsible className="w-full">
						{processItems.map((item) => (
							<AccordionItem key={item.id} value={item.id}>
								<AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
								<AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</CardContent>
			</Card>
		</section>
	);
};
