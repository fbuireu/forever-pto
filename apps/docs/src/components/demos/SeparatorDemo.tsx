import { Separator } from "@ui/modules/core/primitives/Separator";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

export const SeparatorDemo = () => (
	<Demo className="flex-col items-stretch">
		<div>
			<p className="text-sm font-medium">Annual allowance</p>
			<p className="text-muted-foreground text-sm">How many PTO days you get per year.</p>
		</div>
		<Separator />
		<div className="flex h-6 items-center gap-4 text-sm">
			<span>Grouped</span>
			<Separator orientation="vertical" />
			<span>Optimized</span>
			<Separator orientation="vertical" />
			<span>Balanced</span>
		</div>
	</Demo>
);

export const SEPARATOR_PROP_ROWS = propRows<OwnProps<ComponentProps<typeof Separator>, ComponentProps<"div">>>({
	orientation: {
		type: '"horizontal" | "vertical"',
		defaultValue: '"horizontal"',
		description: "Direction of the hairline. Vertical needs a parent with a height to stretch into.",
	},
	decorative: {
		type: "boolean",
		defaultValue: "true",
		description:
			"When true the element carries role=none and is invisible to assistive technology. Set false to expose it as a separator with its orientation.",
	},
});
