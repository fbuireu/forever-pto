import type { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui/modules/core/animate/base/Collapsible";
import { Input } from "@ui/modules/core/primitives/Input";
import { Label } from "@ui/modules/core/primitives/Label";
import { type ComponentProps, useState } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

export const CollapsibleDemo = () => {
	const [open, setOpen] = useState(false);

	return (
		<Demo>
			<Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-md">
				<CollapsibleTrigger>Have a promo code?</CollapsibleTrigger>
				<CollapsibleContent className="px-0.5 pt-2 pb-1">
					<div className="grid gap-2">
						<Label htmlFor="collapsible-demo-promo">Promo code</Label>
						<Input id="collapsible-demo-promo" placeholder="You wish it was that easy" />
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Demo>
	);
};

export const COLLAPSIBLE_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state." },
	onOpenChange: { type: "(open: boolean, details) => void", description: "Fires when the trigger toggles." },
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
