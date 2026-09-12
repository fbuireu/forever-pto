import {
	TOOLTIP_DELAY_MS,
	Tooltip,
	TooltipContent,
	TooltipInfoTrigger,
	TooltipTrigger,
} from "@ui/modules/core/animate/base/Tooltip";
import { Button } from "@ui/modules/core/primitives/Button";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const TooltipDemo = () => (
	<Demo>
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="outline">Hover me</Button>
			</TooltipTrigger>
			<TooltipContent>Springs in from scale 0.5 with a rotated square arrow.</TooltipContent>
		</Tooltip>
		<Tooltip delay={500}>
			<TooltipTrigger asChild>
				<Button variant="secondary">Delayed (500ms)</Button>
			</TooltipTrigger>
			<TooltipContent>This one waits half a second before opening.</TooltipContent>
		</Tooltip>
	</Demo>
);

export const TooltipInfoTriggerDemo = () => (
	<Demo>
		<div className="flex items-center gap-2 text-sm font-semibold">
			Efficiency score
			<Tooltip>
				<TooltipInfoTrigger className="ml-0" />
				<TooltipContent>Days off gained per PTO day spent.</TooltipContent>
			</Tooltip>
		</div>
	</Demo>
);

export { TOOLTIP_DELAY_MS };

export const TOOLTIP_PROP_ROWS = propRows({
	delay: {
		type: "number",
		description:
			"Milliseconds before the tooltip opens on hover. When set, the Tooltip wraps itself in a provider carrying it.",
	},
	delayDuration: {
		type: "number",
		description: "Alias of delay, kept so Radix-shaped call sites read naturally; it wins when both are set.",
	},
	open: { type: "boolean", description: "Controlled state, for a tooltip a form error keeps open." },
	onOpenChange: { type: "(open: boolean, details) => void", description: "Fires on hover, focus and Esc." },
});

export const TOOLTIP_CONTENT_PROP_ROWS = propRows({
	side: {
		type: '"top" | "bottom" | "left" | "right"',
		defaultValue: '"top"',
		description: "Preferred side; the arrow repositions through data-side.",
	},
	align: {
		type: '"start" | "center" | "end"',
		defaultValue: '"center"',
		description: "Alignment along the trigger's edge.",
	},
	sideOffset: { type: "number", defaultValue: "4", description: "Gap between the trigger and the bubble, in pixels." },
});
