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
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="secondary">Aligned to start</Button>
			</PopoverTrigger>
			<PopoverContent align="start" sideOffset={8} className="w-56">
				<p className="m-0 text-sm">align='start' and sideOffset={"{8}"} on this one.</p>
			</PopoverContent>
		</Popover>
	</Demo>
);

export const POPOVER_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state." },
	defaultOpen: { type: "boolean", defaultValue: "false", description: "Uncontrolled initial state." },
	onOpenChange: { type: "(open: boolean, details) => void", description: "Fires on trigger, Esc and outside click." },
});

export const POPOVER_CONTENT_PROP_ROWS = propRows({
	align: {
		type: '"start" | "center" | "end"',
		defaultValue: '"center"',
		description: "Alignment along the trigger's edge.",
	},
	side: {
		type: '"top" | "bottom" | "left" | "right"',
		defaultValue: '"bottom"',
		description: "Which side of the trigger the panel opens on; flips when there is no room.",
	},
	sideOffset: { type: "number", defaultValue: "4", description: "Gap between the trigger and the panel, in pixels." },
	positionerClassName: {
		type: "string",
		description: "Classes on the positioning wrapper, which carries the z-index; className styles the panel itself.",
	},
	initialFocus: {
		type: "RefObject | (interaction) => Element",
		description: "Where focus lands on open. Defaults to the first tabbable element in the panel.",
	},
	finalFocus: {
		type: "RefObject | (interaction) => Element",
		description: "Where focus returns on close. Defaults to the trigger.",
	},
});
