import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipTrigger } from "@ui/modules/core/animate/base/Tooltip";
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
	</Demo>
);

export const TooltipInfoTriggerDemo = () => (
	<Demo>
		<div className="flex items-center gap-2 text-sm font-semibold">
			Efficiency score
			<Tooltip>
				<TooltipInfoTrigger aria-label="About the Efficiency score" />
				<TooltipContent>Effective days gained per PTO day spent.</TooltipContent>
			</Tooltip>
		</div>
	</Demo>
);

export const TOOLTIP_CONTENT_PROP_ROWS = propRows({
	side: {
		type: '"top" | "bottom" | "left" | "right"',
		defaultValue: '"top"',
		description: "Preferred side; the arrow repositions through data-side. The sidebar sets it to right.",
	},
	align: {
		type: '"start" | "center" | "end"',
		defaultValue: '"center"',
		description: "Alignment along the trigger's edge. The sidebar sets it to center.",
	},
});
