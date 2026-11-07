import { Button } from "@ui/modules/core/primitives/Button";
import { Progress, ProgressOverlayLabel, ProgressTrack } from "@ui/modules/core/primitives/Progress";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

const QUICK_START_STEPS = 3;

export const ProgressDemo = () => {
	const [step, setStep] = useState(1);

	return (
		<Demo className="flex-col items-stretch">
			<div className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
				Step {step} of {QUICK_START_STEPS}
			</div>
			<Progress value={(step / QUICK_START_STEPS) * 100} aria-label="Set up your planner">
				<ProgressTrack className="h-3" />
			</Progress>
			<div className="flex gap-2">
				<Button size="sm" variant="outline" disabled={step === 1} onClick={() => setStep((current) => current - 1)}>
					Back
				</Button>
				<Button size="sm" disabled={step === QUICK_START_STEPS} onClick={() => setStep((current) => current + 1)}>
					Next
				</Button>
			</div>
		</Demo>
	);
};

const PROGRESS_TRANSITION = { type: "tween", duration: 0.15, ease: "easeOut" } as const;

export const ProgressCustomDemo = () => (
	<Demo className="flex-col items-stretch">
		<Progress value={39}>
			<div className="relative h-[22px]">
				<ProgressTrack
					className="h-[22px] rounded-full bg-background shadow-[var(--shadow-brutal-3)] flex items-center"
					indicatorClassName="rounded-full border-r-[3px] border-[var(--frame)]"
					transition={PROGRESS_TRANSITION}
				/>
				<ProgressOverlayLabel overlayClassName="text-[var(--color-brand-ink)]">
					7 / 18 days used · 39%
				</ProgressOverlayLabel>
			</div>
		</Progress>
		<Progress value={61}>
			<div className="relative h-[22px]">
				<ProgressTrack
					className="h-[22px] rounded-full bg-background shadow-[var(--shadow-brutal-3)] flex items-center"
					indicatorClassName="rounded-full border-r-[3px] border-[var(--frame)] bg-[var(--color-brand-teal)]"
					transition={PROGRESS_TRANSITION}
				/>
				<ProgressOverlayLabel overlayClassName="text-[var(--color-brand-ink)]">11 remaining · 61%</ProgressOverlayLabel>
			</div>
		</Progress>
	</Demo>
);

export const PROGRESS_PROP_ROWS = propRows({
	value: {
		type: "number",
		description: "The current value in percent, read by the track's indicator and exposed as aria-valuenow.",
	},
});

export const PROGRESS_TRACK_PROP_ROWS = propRows({
	indicatorClassName: { type: "string", description: "Classes for the filled part, which is bg-accent by default." },
	transition: {
		type: "Transition",
		defaultValue: '{ type: "spring", stiffness: 100, damping: 30 }',
		description: "Motion transition applied to the indicator's width whenever value changes.",
	},
});

export const PROGRESS_LABEL_PROP_ROWS = propRows({
	children: {
		type: "ReactNode",
		description:
			"The label, rendered twice: once over the track and once clipped to the filled part in the inverse colour.",
	},
	overlayClassName: { type: "string", description: "Classes on the clipped, inverse-coloured copy." },
});
