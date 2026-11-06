import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@ui/modules/core/animate/base/Accordion";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

const ITEMS = [
	{
		id: "how",
		question: "How does the optimizer work?",
		answer:
			"It looks at public holidays and weekends, then places your PTO days where they bridge the longest streaks.",
	},
	{
		id: "strategies",
		question: "What are strategies?",
		answer:
			"Grouped, Optimized, Balanced and Main vacation change how PTO days are clustered around holidays, spread across the year or built around the trip you want.",
	},
	{
		id: "regions",
		question: "Are regional holidays supported?",
		answer: "Yes: pick a region and its holidays are merged with the national calendar.",
	},
];

export const AccordionDemo = () => (
	<Demo>
		<Accordion className="w-full max-w-md">
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
