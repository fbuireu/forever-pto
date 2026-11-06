import { cn } from "@ui/utils/cn";

const DAYS_IN_WEEK = 7;

interface EffectiveDaysBandProps {
	stretch: readonly boolean[];
	position: number;
}

export const EffectiveDaysBand = ({ stretch, position }: EffectiveDaysBandProps) => {
	if (stretch[position] !== true) return null;

	const joinsPrevious = position % DAYS_IN_WEEK !== 0 && stretch[position - 1] === true;
	const joinsNext = position % DAYS_IN_WEEK !== DAYS_IN_WEEK - 1 && stretch[position + 1] === true;

	return (
		<span
			aria-hidden="true"
			data-slot="effective-stretch"
			className={cn(
				"pointer-events-none absolute -inset-y-[3px] bg-highlighter",
				joinsPrevious ? "-left-1" : "-left-[3px] rounded-l-[11px]",
				joinsNext ? "-right-1" : "-right-[3px] rounded-r-[11px]",
			)}
		/>
	);
};
