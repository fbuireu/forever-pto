import type { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui/modules/core/animate/base/Collapsible";
import { Button } from "@ui/modules/core/primitives/Button";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

export const CollapsibleDemo = () => (
	<Demo>
		<Collapsible className="w-full max-w-md">
			<CollapsibleTrigger>Advanced options</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="space-y-2 px-3 py-4 text-sm text-muted-foreground">
					<p className="m-0">Carryover months, past months and other knobs live behind this fold.</p>
					<p className="m-0">While open, the trigger keeps its lifted pressed style via aria-expanded.</p>
				</div>
			</CollapsibleContent>
		</Collapsible>
	</Demo>
);

export const CollapsibleAsChildDemo = () => (
	<Demo>
		<Collapsible className="w-full max-w-md">
			<CollapsibleTrigger asChild>
				<Button variant="accent">Custom trigger via asChild</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<p className="m-0 py-4 text-sm text-muted-foreground">
					With asChild the default brutal trigger styling is skipped and your element is used instead.
				</p>
			</CollapsibleContent>
		</Collapsible>
	</Demo>
);

export const COLLAPSIBLE_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state." },
	defaultOpen: { type: "boolean", defaultValue: "false", description: "Uncontrolled initial state." },
	onOpenChange: { type: "(open: boolean, details) => void", description: "Fires when the trigger toggles." },
	disabled: { type: "boolean", description: "Blocks the trigger." },
});

export const COLLAPSIBLE_TRIGGER_PROP_ROWS = propRows<
	OwnProps<ComponentProps<typeof CollapsibleTrigger>, ComponentProps<typeof CollapsiblePrimitive.Trigger>>
>({
	asChild: {
		type: "boolean",
		defaultValue: "false",
		description:
			"Use the single child as the trigger element instead of the brutal default button; the child receives the aria attributes.",
	},
});

export const COLLAPSIBLE_CONTENT_PROP_ROWS = propRows({
	transition: {
		type: "Transition",
		description: "Motion transition of the height and opacity. Every other HTMLMotionProps of a div is accepted too.",
	},
});
