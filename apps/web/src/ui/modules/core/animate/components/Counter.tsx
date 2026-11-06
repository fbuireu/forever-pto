"use client";

import { cn } from "@ui/utils/cn";
import { type HTMLMotionProps, m } from "motion/react";
import { SlidingNumber } from "../text/SlidingNumber";

type CounterButtonProps = Pick<HTMLMotionProps<"button">, "disabled">;

interface CounterProps {
	number: number;
	setNumber: (number: number) => void;
	decrementLabel: string;
	incrementLabel: string;
	label: string;
	decrementButtonProps: CounterButtonProps;
	incrementButtonProps: CounterButtonProps;
}

function Counter({
	number,
	setNumber,
	decrementLabel,
	incrementLabel,
	label,
	decrementButtonProps,
	incrementButtonProps,
}: CounterProps) {
	const btnBase =
		"w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] font-display font-black text-[22px] leading-none hover:bg-[var(--accent)] hover:text-[var(--color-brand-ink)] transition-colors duration-75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none";

	return (
		<m.div
			data-slot="counter"
			layout
			layoutDependency={number}
			transition={{ type: "spring", bounce: 0, stiffness: 300, damping: 30 }}
			className="inline-flex items-stretch overflow-hidden rounded-xl border-[3px] border-(--frame) bg-(--surface-panel) shadow-(--shadow-brutal-sm)"
		>
			<m.button
				type="button"
				whileTap={{ filter: "brightness(0.85)" }}
				{...decrementButtonProps}
				aria-label={decrementLabel}
				onClick={() => setNumber(number - 1)}
				className={cn(btnBase, "border-r-[3px] border-(--frame)")}
			>
				−
			</m.button>

			<div className="w-20 grid place-items-center py-2 leading-none">
				<SlidingNumber number={number} className="font-display font-black text-[22px] leading-none" />
				<small className="font-mono text-[10px] font-semibold uppercase text-muted-foreground -mt-px tracking-[0.06em]">
					{label}
				</small>
			</div>

			<m.button
				type="button"
				whileTap={{ filter: "brightness(0.85)" }}
				{...incrementButtonProps}
				aria-label={incrementLabel}
				onClick={() => setNumber(number + 1)}
				className={cn(btnBase, "border-l-[3px] border-(--frame)")}
			>
				+
			</m.button>
		</m.div>
	);
}

export { Counter };
