"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

interface SliderProps {
	label: string;
	value: number[];
	min: number;
	max: number;
	step: number;
	onValueChange: (value: number[]) => void;
}

function Slider({ label, value, min, max, step, onValueChange }: SliderProps) {
	return (
		<SliderPrimitive.Root
			value={value}
			min={min}
			max={max}
			step={step}
			onValueChange={(val) => onValueChange(typeof val === "number" ? [val] : [...val])}
			className="relative flex w-full touch-none items-center select-none"
		>
			<SliderPrimitive.Control className="relative flex w-full touch-none items-center">
				<SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-[var(--surface-panel-alt)] border-[3px] border-[var(--frame)] shadow-[var(--shadow-brutal-xs)]">
					<SliderPrimitive.Indicator className="absolute h-full bg-[var(--frame)]" />
				</SliderPrimitive.Track>
				<SliderPrimitive.Thumb
					aria-label={label}
					className="block hit-area-stable size-7 rounded-full border-[3px] border-[var(--frame)] bg-accent shadow-[var(--shadow-brutal-xs)] transition-all duration-75 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)]"
				/>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
