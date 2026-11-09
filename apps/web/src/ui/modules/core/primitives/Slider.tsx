"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@ui/utils/cn";

interface SliderProps {
	label: string;
	value: number[];
	min: number;
	max: number;
	step: number;
	onValueChange: (value: number[]) => void;
}

const HANDLE_CLEARANCE = "8px";

const SEGMENT = "pointer-events-none absolute inset-y-0 shadow-[inset_0_0_0_3px_var(--frame),var(--shadow-brutal-xs)]";

interface PercentOfParams {
	value: number;
	min: number;
	max: number;
}

const percentOf = ({ value, min, max }: PercentOfParams): number =>
	max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

function Slider({ label, value, min, max, step, onValueChange }: SliderProps) {
	const percent = percentOf({ value: value[0] ?? min, min, max });

	return (
		<SliderPrimitive.Root
			value={value}
			min={min}
			max={max}
			step={step}
			onValueChange={(val) => onValueChange(typeof val === "number" ? [val] : [...val])}
			className="relative flex w-full touch-none items-center select-none"
		>
			<SliderPrimitive.Control className="relative flex h-8 w-full touch-none items-center">
				<SliderPrimitive.Track className="relative h-4 w-full grow">
					<span
						data-slot="slider-range"
						aria-hidden
						className={cn(SEGMENT, "start-0 rounded-s-full rounded-e-[4px] bg-accent")}
						style={{ insetInlineEnd: `calc(${100 - percent}% + ${HANDLE_CLEARANCE})` }}
					/>
					<span
						data-slot="slider-rest"
						aria-hidden
						className={cn(
							SEGMENT,
							"end-0 overflow-hidden rounded-e-full rounded-s-[4px] bg-[var(--surface-panel-alt)] after:absolute after:end-[7px] after:top-1/2 after:size-1.5 after:-translate-y-1/2 after:rounded-full after:bg-[var(--frame)]",
						)}
						style={{ insetInlineStart: `calc(${percent}% + ${HANDLE_CLEARANCE})` }}
					/>
				</SliderPrimitive.Track>
				<SliderPrimitive.Thumb
					aria-label={label}
					className="flex h-8 w-6 cursor-grab items-center justify-center before:h-full before:w-1.5 before:rounded-full before:bg-[var(--frame)] before:transition-[width] before:duration-100 data-dragging:cursor-grabbing data-dragging:before:w-1 has-[:focus-visible]:before:outline-[3px] has-[:focus-visible]:before:outline-offset-2 has-[:focus-visible]:before:outline-ring"
				/>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
