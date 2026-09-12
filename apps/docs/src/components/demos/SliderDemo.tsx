import { Slider } from "@ui/modules/core/primitives/Slider";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const SliderDemo = () => {
	const [value, setValue] = useState([15]);

	return (
		<Demo className="flex-col items-stretch">
			<Slider label="PTO days" value={value} onValueChange={setValue} min={0} max={30} step={1} />
			<p className="m-0 font-mono text-sm font-bold">{value[0]} PTO days</p>
		</Demo>
	);
};

export const SliderRangeDemo = () => {
	const [range, setRange] = useState([8, 22]);

	return (
		<Demo className="flex-col items-stretch">
			<Slider label="Day range" value={range} onValueChange={setRange} min={0} max={31} step={1} />
			<p className="m-0 font-mono text-sm font-bold">
				Day {range[0]} → day {range[1]}
			</p>
		</Demo>
	);
};

export const SliderDisabledDemo = () => (
	<Demo>
		<Slider label="PTO days" defaultValue={10} max={30} disabled className="max-w-sm" />
	</Demo>
);

export const SLIDER_PROP_ROWS = propRows<keyof ComponentProps<typeof Slider>>({
	label: {
		type: "string",
		description:
			"Accessible name of the thumb (its aria-label). Required: a slider without one announces only a number.",
	},
	className: { type: "string", description: "Classes on the root." },
	defaultValue: {
		type: "number | number[]",
		description: "Uncontrolled initial value. An array renders one thumb per entry, so a pair makes a range slider.",
	},
	value: { type: "number | number[]", description: "Controlled value, same shape rule as defaultValue." },
	min: { type: "number", defaultValue: "0", description: "Lower bound." },
	max: { type: "number", defaultValue: "100", description: "Upper bound." },
	step: { type: "number", defaultValue: "1", description: "Increment for keyboard and drag." },
	onValueChange: {
		type: "(value: number[]) => void",
		description: "Fires on every change while dragging. Always receives an array, whatever shape value has.",
	},
	onValueCommitted: {
		type: "(value: number[]) => void",
		description: "Fires once when the pointer is released or a key press ends. Use it for the expensive side effect.",
	},
	disabled: { type: "boolean", description: "Halves the opacity and blocks interaction." },
});
