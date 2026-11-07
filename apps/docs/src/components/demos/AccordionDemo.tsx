import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@ui/modules/core/animate/base/Accordion";
import en from "../../../../web/src/ui/i18n/messages/en.json";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

const ITEMS = [
	{
		id: "whatIsPto",
		question: en.faq.sections.general.whatIsPto.question,
		answer: en.faq.sections.general.whatIsPto.answer,
	},
	{ id: "pricing", question: en.faq.sections.general.pricing.question, answer: en.faq.sections.general.pricing.answer },
	{ id: "premium", question: en.faq.sections.general.premium.question, answer: en.faq.sections.general.premium.answer },
];

export const AccordionDemo = () => (
	<Demo>
		<Accordion multiple className="w-full max-w-md">
			{ITEMS.map((item) => (
				<AccordionItem key={item.id} value={item.id}>
					<AccordionTrigger>{item.question}</AccordionTrigger>
					<AccordionPanel className="text-muted-foreground">{item.answer}</AccordionPanel>
				</AccordionItem>
			))}
		</Accordion>
	</Demo>
);

export const ACCORDION_PROP_ROWS = propRows({
	multiple: {
		type: "boolean",
		defaultValue: "false",
		description: "Whether more than one item may be open. Off, opening an item closes the others.",
	},
});
