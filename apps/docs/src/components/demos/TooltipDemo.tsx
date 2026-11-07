import {
	Tooltip,
	TooltipContent,
	TooltipInfoTrigger,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/modules/core/animate/base/Tooltip";
import { Button } from "@ui/modules/core/primitives/Button";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const TooltipDemo = () => (
	<Demo>
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline" size="icon" className="size-8">
						25
					</Button>
				</TooltipTrigger>
				<TooltipContent>Christmas Day</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	</Demo>
);

export const TooltipInfoTriggerDemo = () => (
	<Demo>
		<div className="flex items-center gap-2 font-mono text-sm">
			Carry-over months
			<TooltipProvider>
				<Tooltip>
					<TooltipInfoTrigger aria-label="More information about carry-over months" />
					<TooltipContent className="w-50 text-pretty">
						Extend the planning window into the following year to find more bridge opportunities.
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
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
