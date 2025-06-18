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

interface FaqProps {
	locale: LocaleKey;
}

export const Faq = async ({ locale }: FaqProps) => {
	const t = await getTranslations({ locale, namespace: "faq" });

	const faqItems = [
		{
			id: "individual-vs-blocks",
			question: t("questions.individualVsBlocks.question"),
			answer: t("questions.individualVsBlocks.answer"),
		},
		{
			id: "all-pto-usage",
			question: t("questions.allPtoUsage.question"),
			answer: t("questions.allPtoUsage.answer"),
		},
		{
			id: "block-sizes",
			question: t("questions.blockSizes.question"),
			answer: t("questions.blockSizes.answer"),
		},
		{
			id: "weekends-handling",
			question: t("questions.weekendsHandling.question"),
			answer: t("questions.weekendsHandling.answer"),
		},
		{
			id: "past-dates",
			question: t("questions.pastDates.question"),
			answer: t("questions.pastDates.answer"),
		},
		{
			id: "different-countries",
			question: t("questions.differentCountries.question"),
			answer: t("questions.differentCountries.answer"),
		},
		{
			id: "alternative-days",
			question: t("questions.alternativeDays.question"),
			answer: t("questions.alternativeDays.answer"),
		},
		{
			id: "weekend-customization",
			question: t("questions.weekendCustomization.question"),
			answer: t("questions.weekendCustomization.answer"),
		},
		{
			id: "partial-pto",
			question: t("questions.partialPto.question"),
			answer: t("questions.partialPto.answer"),
		},
	];

	const limitationItems = [
		{
			id: "algorithm-type",
			question: t("limitations.algorithmType.question"),
			answer: t("limitations.algorithmType.answer"),
		},
		{
			id: "max-alternatives",
			question: t("limitations.maxAlternatives.question"),
			answer: t("limitations.maxAlternatives.answer"),
		},
		{
			id: "personal-preferences",
			question: t("limitations.personalPreferences.question"),
			answer: t("limitations.personalPreferences.answer"),
		},
		{
			id: "external-events",
			question: t("limitations.externalEvents.question"),
			answer: t("limitations.externalEvents.answer"),
		},
		{
			id: "fixed-pto",
			question: t("limitations.fixedPto.question"),
			answer: t("limitations.fixedPto.answer"),
		},
	];

	return (
		<section className="w-full max-w-4xl mx-auto space-y-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Accordion type="single" collapsible className="w-full">
						{faqItems.map((item) => (
							<AccordionItem key={item.id} value={item.id}>
								<AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
								<AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl font-bold">{t("limitationsTitle")}</CardTitle>
					<CardDescription>{t("limitationsDescription")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Accordion type="single" collapsible className="w-full">
						{limitationItems.map((item) => (
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
