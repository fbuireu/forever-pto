import { RotatingText } from "@ui/modules/core/animate/text/Rotating";
import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";
import { Button } from "@ui/modules/core/primitives/Button";
import { useState } from "react";
import { Demo } from "../Demo";

export const SlidingNumberDemo = () => {
	const [value, setValue] = useState(23);

	return (
		<Demo>
			<Button size="icon" variant="outline" aria-label="Subtract 7" onClick={() => setValue((v) => Math.max(0, v - 7))}>
				−
			</Button>
			<SlidingNumber number={value} className="font-display text-4xl font-black" />
			<Button size="icon" variant="outline" aria-label="Add 7" onClick={() => setValue((v) => v + 7)}>
				+
			</Button>
			<span className="ml-6 flex items-baseline gap-2 text-muted-foreground">
				<SlidingNumber number={value / 10} decimalPlaces={1} padStart className="text-2xl font-bold" />
				<code className="text-xs">decimalPlaces=1 padStart</code>
			</span>
		</Demo>
	);
};

const FIRST_REST_BLOCKS = ["January", "March", "July", "December"];

export const RotatingTextDemo = () => {
	const [index, setIndex] = useState(0);

	return (
		<Demo>
			<div className="text-center">
				<div className="text-sm text-muted-foreground">First rest block</div>
				<div className="flex justify-center font-display text-lg font-bold">
					<RotatingText text={FIRST_REST_BLOCKS[index]} />
				</div>
			</div>
			<Button
				size="sm"
				variant="outline"
				onClick={() => setIndex((current) => (current + 1) % FIRST_REST_BLOCKS.length)}
			>
				Pick another plan
			</Button>
		</Demo>
	);
};
