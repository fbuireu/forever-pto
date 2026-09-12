import type { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { Button } from "@ui/modules/core/primitives/Button";
import { Progress, ProgressOverlayLabel, ProgressTrack } from "@ui/modules/core/primitives/Progress";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";

export const ProgressDemo = () => {
	const [value, setValue] = useState(40);

	return (
		<Demo className="flex-col items-stretch">
			<Progress value={value}>
				<div className="relative h-5">
					<ProgressTrack />
					<ProgressOverlayLabel>{value}% of PTO used</ProgressOverlayLabel>
				</div>
			</Progress>
			<div className="flex gap-2">
				<Button size="sm" variant="outline" onClick={() => setValue((v) => Math.max(0, v - 10))}>
					Use less
				</Button>
				<Button size="sm" variant="outline" onClick={() => setValue((v) => Math.min(100, v + 10))}>
					Use more
				</Button>
			</div>
		</Demo>
	);
};

export const ProgressCustomDemo = () => (
	<Demo className="flex-col items-stretch">
		<Progress value={65}>
			<div className="relative h-[22px]">
				<ProgressTrack
					className="h-[22px] rounded-full bg-background"
					indicatorClassName="rounded-full border-r-[3px] border-[var(--frame)] bg-[var(--color-brand-teal)]"
					transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
				/>
				<ProgressOverlayLabel overlayClassName="text-[var(--color-brand-ink)]">65% remaining</ProgressOverlayLabel>
			</div>
		</Progress>
	</Demo>
);

export const PROGRESS_PROP_ROWS = propRows({
	value: {
		type: "number | null",
		description:
			"The current value in percent, read by the track's indicator and exposed as aria-valuenow. null renders an indeterminate bar.",
	},
	max: { type: "number", defaultValue: "100", description: "Upper bound the value is measured against." },
});

export const PROGRESS_TRACK_PROP_ROWS = propRows<
	OwnProps<ComponentProps<typeof ProgressTrack>, ComponentProps<typeof ProgressPrimitive.Track>>
>({
	indicatorClassName: { type: "string", description: "Classes for the filled part, which is bg-accent by default." },
	transition: {
		type: "Transition",
		defaultValue: '{ type: "spring", stiffness: 100, damping: 30 }',
		description: "Motion transition applied to the indicator's width whenever value changes.",
	},
});

export const PROGRESS_LABEL_PROP_ROWS = propRows<keyof ComponentProps<typeof ProgressOverlayLabel>>({
	children: {
		type: "ReactNode",
		description:
			"The label, rendered twice: once over the track and once clipped to the filled part in the inverse colour.",
	},
	className: { type: "string", description: "Classes on the outer label layer." },
	overlayClassName: { type: "string", description: "Classes on the clipped, inverse-coloured copy." },
	transition: {
		type: "Transition",
		defaultValue: "the track's",
		description: "Transition of the clip-path, so the inverse copy keeps pace with the indicator.",
	},
});
