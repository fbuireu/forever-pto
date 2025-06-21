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
import { FAQ_LIMITATIONS, FAQ_QUESTIONS } from "./const";

interface FaqProps {
	locale: LocaleKey;
}

export const Faq = async ({ locale }: FaqProps) => {
	const t = await getTranslations({ locale, namespace: "faq" });

	const faqs = FAQ_QUESTIONS.map((key, index) => ({
		id: `question-${index}`,
		question: t(`questions.${key}.question`),
		answer: t(`questions.${key}.answer`),
	}));

	const limitations = FAQ_LIMITATIONS.map((key, index) => ({
		id: `limitation-${index}`,
		question: t(`limitations.${key}.question`),
		answer: t(`limitations.${key}.answer`),
	}));

	return (
		<section className="w-full max-w-4xl mx-auto space-y-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Accordion type="single" collapsible className="w-full">
						{faqs.map((item) => (
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
						{limitations.map((item) => (
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
