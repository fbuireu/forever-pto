import { Slider } from "@ui/modules/core/primitives/Slider";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const SliderDemo = () => {
	const [value, setValue] = useState([3]);

	return (
		<Demo className="flex-col items-stretch">
			<Slider label="Carry-over months" value={value} onValueChange={setValue} min={0} max={6} step={1} />
			<p className="m-0 font-mono text-sm font-bold">{value[0]} months</p>
		</Demo>
	);
};

export const SLIDER_PROP_ROWS = propRows<keyof ComponentProps<typeof Slider>>({
	label: {
		type: "string",
		description:
			"Accessible name of the thumb (its aria-label). Required: a slider without one announces only a number.",
	},
	value: { type: "number[]", description: "The controlled value, one entry per thumb." },
	min: { type: "number", description: "Lower bound." },
	max: { type: "number", description: "Upper bound." },
	step: { type: "number", description: "Increment for keyboard and drag." },
	onValueChange: {
		type: "(value: number[]) => void",
		description: "Fires on every change while dragging. Always receives an array.",
	},
});
