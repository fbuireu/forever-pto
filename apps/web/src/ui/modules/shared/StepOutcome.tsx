import { Button } from "@ui/modules/core/primitives/Button";
import { cn } from "@ui/utils/cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export const Step = {
	INPUT: "input",
	SUCCESS: "success",
	ERROR: "error",
} as const;

export type Step = (typeof Step)[keyof typeof Step];

export const StepOutcomeTone = {
	SUCCESS: "success",
	ERROR: "error",
} as const;

export type StepOutcomeTone = (typeof StepOutcomeTone)[keyof typeof StepOutcomeTone];

const TILE_CLASS: Record<StepOutcomeTone, string> = {
	[StepOutcomeTone.SUCCESS]: "bg-[var(--color-brand-teal)]",
	[StepOutcomeTone.ERROR]: "bg-destructive",
};

const BADGE_CLASS: Record<StepOutcomeTone, string> = {
	[StepOutcomeTone.SUCCESS]: "bg-[var(--color-brand-teal)]",
	[StepOutcomeTone.ERROR]: "bg-destructive text-white",
};

const DOT_CLASS: Record<StepOutcomeTone, string> = {
	[StepOutcomeTone.SUCCESS]: "bg-[var(--color-brand-ink)]",
	[StepOutcomeTone.ERROR]: "bg-white",
};

interface StepOutcomeProps {
	tone: StepOutcomeTone;
	icon: ReactNode;
	title: string;
	description: string;
	onClose: () => void;
	onTryAgain?: () => void;
}

export const StepOutcome = ({ tone, icon, title, description, onClose, onTryAgain }: StepOutcomeProps) => {
	const t = useTranslations("formButtons");

	return (
		<div className="flex flex-col items-center gap-5 py-4">
			<div
				className={cn(
					"size-16 border-[3px] border-[var(--frame)] rounded-[14px] shadow-[var(--shadow-brutal-btn)] grid place-items-center",
					TILE_CLASS[tone],
				)}
			>
				{icon}
			</div>
			<div className="text-center">
				<span
					className={cn(
						"inline-flex items-center gap-2 border-[2px] border-[var(--frame)] rounded-[6px] px-3 py-1 font-mono text-[11px] font-bold tracking-[0.12em] uppercase mb-3",
						BADGE_CLASS[tone],
					)}
				>
					<span className={cn("size-1.5 rounded-full", DOT_CLASS[tone])} />
					{title}
				</span>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			{onTryAgain ? (
				<div className="flex gap-2 w-full">
					<Button variant="outline" onClick={onTryAgain} className="flex-1">
						{t("tryAgain")}
					</Button>
					<Button onClick={onClose} variant="destructive" className="flex-1">
						{t("close")}
					</Button>
				</div>
			) : (
				<Button variant="destructive" size="sm" onClick={onClose}>
					{t("close")}
				</Button>
			)}
		</div>
	);
};
