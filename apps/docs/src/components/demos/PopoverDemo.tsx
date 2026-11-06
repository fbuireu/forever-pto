import { Popover, PopoverContent, PopoverTrigger } from "@ui/modules/core/animate/base/Popover";
import { Button } from "@ui/modules/core/primitives/Button";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const PopoverDemo = () => (
	<Demo>
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Open popover</Button>
			</PopoverTrigger>
			<PopoverContent>
				<p className="m-0 text-sm font-bold">Anchored panel</p>
				<p className="m-0 mt-1 text-sm text-muted-foreground">
					Springs from scale 0.5 to 1 out of the trigger. Click outside or press Esc to close.
				</p>
			</PopoverContent>
		</Popover>
	</Demo>
);

export const POPOVER_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state." },
	onOpenChange: { type: "(open: boolean, details) => void", description: "Fires on trigger, Esc and outside click." },
});

export const POPOVER_CONTENT_PROP_ROWS = propRows({
	collisionAvoidance: {
		type: "object",
		description:
			"Base UI positioner's collision handling, passed through. The Combobox sets it so its list may flip above or below the trigger but never to the side.",
	},
});
