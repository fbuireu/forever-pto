import type { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@ui/modules/core/animate/base/Accordion";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

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
		answer: "Grouped, Optimized and Balanced change how aggressively PTO days are clustered around holidays.",
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

export const AccordionNoChevronDemo = () => (
	<Demo>
		<Accordion className="w-full max-w-md">
			<AccordionItem value="plain">
				<AccordionTrigger chevron={false}>No chevron on this trigger</AccordionTrigger>
				<AccordionPanel className="text-muted-foreground">
					Pass chevron={"{false}"} when the trigger supplies its own affordance.
				</AccordionPanel>
			</AccordionItem>
		</Accordion>
	</Demo>
);

export const ACCORDION_PROP_ROWS = propRows({
	openMultiple: {
		type: "boolean",
		defaultValue: "false",
		description: "Whether more than one item may be open. Off, opening an item closes the others.",
	},
	value: { type: "unknown[]", description: "Controlled list of open item values." },
	defaultValue: { type: "unknown[]", description: "Uncontrolled initial open items." },
	onValueChange: { type: "(value: unknown[]) => void", description: "Fires with the new list of open values." },
});

export const ACCORDION_TRIGGER_PROP_ROWS = propRows<
	OwnProps<ComponentProps<typeof AccordionTrigger>, ComponentProps<typeof AccordionPrimitive.Trigger>>
>({
	transition: {
		type: "Transition",
		defaultValue: '{ type: "spring", stiffness: 150, damping: 22 }',
		description: "Spring driving the chevron's 45° rotation.",
	},
	chevron: {
		type: "boolean",
		defaultValue: "true",
		description:
			"Whether the + square renders. Off, the trigger is text only and the open state has no visual cue beyond the panel.",
	},
});

export const ACCORDION_PANEL_PROP_ROWS = propRows<
	OwnProps<ComponentProps<typeof AccordionPanel>, ComponentProps<typeof AccordionPrimitive.Panel>>
>({
	motionProps: { type: 'HTMLMotionProps<"div">', description: "Extra Motion props merged onto the animated wrapper." },
	transition: {
		type: "Transition",
		defaultValue: "the trigger's spring",
		description: "Transition of the height and opacity when the panel opens or closes.",
	},
});
