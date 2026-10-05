"use client";

import { useHolidaysStore } from "@application/stores/holidays";
import type { AlternativeSelectionBaseParams } from "@application/stores/types";
import type { MeasuredSuggestion } from "@domain/calendar/types";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { usePlanReadout } from "@ui/hooks/usePlanReadout";
import { ChevronLeft } from "@ui/modules/core/animate/icons/ChevronLeft";
import { ChevronRight } from "@ui/modules/core/animate/icons/ChevronRight";
import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";
import { Button } from "@ui/modules/core/primitives/Button";
import { Progress, ProgressOverlayLabel, ProgressTrack } from "@ui/modules/core/primitives/Progress";
import { TUTORIAL_ANCHOR } from "@ui/modules/tutorial/anchors";
import { cn } from "@ui/utils/cn";
import { BarChart3, CalendarDays, Check, Sparkles, TrendingUp } from "lucide-react";
import { m, type Transition, type Variants } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { type ReactNode, useCallback } from "react";
import { EFFICIENCY_FORMAT } from "./utils/helpers";

const STAT_CARD_MOTION_CONFIG = {
	initial: "rest",
	whileHover: "hover",
	whileTap: "tap",
	variants: {
		rest: { maxWidth: "120px" },
		hover: {
			maxWidth: "200px",
			transition: { type: "spring", stiffness: 200, damping: 35, delay: 0.15 },
		},
		tap: { scale: 0.95, maxWidth: "200px" },
	},
	transition: { type: "spring", stiffness: 250, damping: 25 },
} as const;

const LABEL_VARIANTS: Variants = {
	rest: { opacity: 0, x: 4 },
	hover: { opacity: 1, x: 0, visibility: "visible" },
	tap: { opacity: 1, x: 0, visibility: "visible" },
};

const LABEL_TRANSITION: Transition = {
	type: "spring",
	stiffness: 200,
	damping: 25,
};

const BADGE_VARIANTS: Variants = {
	initial: { scale: 0, opacity: 0 },
	animate: {
		scale: 1,
		opacity: 1,
		transition: { type: "spring", stiffness: 200, damping: 20, delay: 0.2 },
	},
};

const STEP_BUTTON_TAP = { filter: "brightness(0.85)" } as const;

const PROGRESS_TRANSITION: Transition = { type: "tween", duration: 0.15, ease: "easeOut" };

const plain = (chunks: ReactNode) => chunks;

interface AlternativesProps {
	allSuggestions: MeasuredSuggestion[];
	onSelectionChange: (params: AlternativeSelectionBaseParams) => void;
	onPreviewChange: (index: number) => void;
	selectedIndex: number;
	currentSelectionIndex: number;
}

function Alternatives({
	allSuggestions,
	onSelectionChange,
	onPreviewChange,
	selectedIndex,
	currentSelectionIndex,
}: AlternativesProps) {
	const t = useTranslations("alternativesManager");
	const format = useFormatter();
	const currentIndex = selectedIndex;
	const totalOptions = allSuggestions.length;
	const currentSuggestion = allSuggestions[currentIndex];

	const handlePrevious = useCallback(() => {
		if (currentIndex > 0) onPreviewChange(currentIndex - 1);
	}, [currentIndex, onPreviewChange]);

	const handleNext = useCallback(() => {
		if (currentIndex < totalOptions - 1) onPreviewChange(currentIndex + 1);
	}, [currentIndex, totalOptions, onPreviewChange]);

	const effectiveDays = currentSuggestion.metrics.totalEffectiveDays;
	const efficiency = currentSuggestion.metrics.averageEfficiency;
	const bonusDays = currentSuggestion.metrics.bonusDays;
	const mainEfficiency = allSuggestions[0]?.metrics.averageEfficiency ?? 0;
	const efficiencyDiff = efficiency - mainEfficiency;
	const isMainSuggestion = currentIndex === 0;

	return (
		<div className="flex flex-wrap items-center gap-3" data-tutorial={TUTORIAL_ANCHOR.ALTERNATIVES_MANAGER}>
			<div className="flex shrink-0 grow items-stretch overflow-hidden rounded-xl border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] shadow-[var(--shadow-brutal-xs)]">
				<m.button
					type="button"
					whileTap={STEP_BUTTON_TAP}
					disabled={currentIndex === 0}
					onClick={handlePrevious}
					aria-label={t("previousSuggestion")}
					className="w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] hover:bg-[var(--accent)] hover:text-[var(--color-brand-ink)] transition-colors duration-75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none border-r-[3px] border-[var(--frame)]"
				>
					<ChevronLeft size={20} />
				</m.button>
				<div className="mx-2 flex grow flex-col items-center justify-center relative duration-300 ease-out py-2">
					<span className="sr-only">
						{t.rich("position", { position: currentIndex + 1, total: totalOptions, label: plain, n: plain, of: plain })}
					</span>
					<div className="flex items-center gap-x-1 text-sm tabular-nums" aria-hidden="true">
						{t.rich("position", {
							position: currentIndex + 1,
							total: totalOptions,
							label: (chunks) => <span className="text-xs text-muted-foreground">{chunks}</span>,
							n: () => (
								<SlidingNumber className="text-base font-semibold text-foreground" padStart number={currentIndex + 1} />
							),
							of: (chunks) => <span className="text-muted-foreground">{chunks}</span>,
						})}
					</div>
					{isMainSuggestion && (
						<m.span
							variants={BADGE_VARIANTS}
							initial="initial"
							animate="animate"
							className="mt-1 flex items-center gap-1 rounded-full border-[3px] border-[var(--frame)] bg-wash-yellow-chip px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-brand-orange-deep)] shadow-[var(--shadow-brutal-xs)]"
						>
							<Sparkles size={8} />
							{t("recommended")}
						</m.span>
					)}
				</div>
				<m.button
					type="button"
					whileTap={STEP_BUTTON_TAP}
					disabled={currentIndex === totalOptions - 1}
					onClick={handleNext}
					aria-label={t("nextSuggestion")}
					className="w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] hover:bg-[var(--accent)] hover:text-[var(--color-brand-ink)] transition-colors duration-75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none border-l-[3px] border-[var(--frame)]"
				>
					<ChevronRight size={20} />
				</m.button>
			</div>

			<div className="hidden lg:block mx-1 h-9 w-[2px] bg-[var(--frame)]/15 rounded-full" />

			<m.div
				layout
				layoutRoot
				layoutDependency={`${currentIndex}|${effectiveDays}|${bonusDays}|${efficiency}`}
				className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap"
			>
				<m.div
					{...STAT_CARD_MOTION_CONFIG}
					className="flex h-11 items-center gap-x-2 overflow-hidden whitespace-nowrap rounded-[10px] border-[3px] border-[var(--frame)] bg-wash-teal px-3 py-2 shadow-[var(--shadow-brutal-xs)]"
				>
					<span className="sr-only">{t("effectiveDaysReadout", { effectiveDays: effectiveDays ?? 0, bonusDays })}</span>
					<CalendarDays size={20} className="text-positive shrink-0" aria-hidden="true" />
					<div className="flex items-center gap-1" aria-hidden="true">
						<SlidingNumber className="text-sm font-semibold text-positive-strong" number={effectiveDays ?? 0} />
						<span className="text-xs text-positive flex">
							{t.rich("bonusDaysBadge", { bonusDays, n: () => <SlidingNumber number={bonusDays} /> })}
						</span>
					</div>
					<m.span
						aria-hidden="true"
						variants={LABEL_VARIANTS}
						transition={LABEL_TRANSITION}
						className="invisible text-sm text-positive"
					>
						{t("totalOff")}
					</m.span>
				</m.div>

				<m.div
					{...STAT_CARD_MOTION_CONFIG}
					className="flex h-11 items-center gap-x-2 overflow-hidden whitespace-nowrap rounded-[10px] border-[3px] border-[var(--frame)] bg-wash-purple px-3 py-2 shadow-[var(--shadow-brutal-xs)]"
				>
					<span className="sr-only">
						{t("efficiencyReadout", {
							suggestion: isMainSuggestion ? "recommended" : "alternative",
							efficiency: format.number(efficiency, EFFICIENCY_FORMAT),
							difference: format.number(efficiencyDiff, { ...EFFICIENCY_FORMAT, signDisplay: "always" }),
						})}
					</span>
					<TrendingUp size={20} className="text-efficiency shrink-0" aria-hidden="true" />
					<div className="flex items-center gap-1" aria-hidden="true">
						<span className="flex items-center text-sm font-semibold text-efficiency-strong">
							{t.rich("efficiencyValue", {
								efficiency: format.number(efficiency, EFFICIENCY_FORMAT),
								n: () => <SlidingNumber number={efficiency} decimalPlaces={1} />,
							})}
						</span>
						{!isMainSuggestion && (
							<span className={cn("text-xs", efficiencyDiff >= 0 ? "text-positive" : "text-negative")}>
								{format.number(efficiencyDiff, { ...EFFICIENCY_FORMAT, signDisplay: "exceptZero" })}
							</span>
						)}
					</div>
					<m.span
						aria-hidden="true"
						variants={LABEL_VARIANTS}
						transition={LABEL_TRANSITION}
						className="invisible text-sm text-efficiency"
					>
						{t("efficiency")}
					</m.span>
				</m.div>

				{!isMainSuggestion && (
					<m.div
						{...STAT_CARD_MOTION_CONFIG}
						className="flex h-11 items-center gap-x-2 overflow-hidden whitespace-nowrap rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel-soft)] px-3 py-2 shadow-[var(--shadow-brutal-xs)]"
					>
						<span className="sr-only">
							{t("comparisonReadout", { ratio: format.number(efficiency / mainEfficiency, { style: "percent" }) })}
						</span>
						<BarChart3 size={20} className="text-comparison-neutral shrink-0" aria-hidden="true" />
						<div className="flex items-center gap-1" aria-hidden="true">
							<span
								className={cn(
									"flex items-center text-sm font-semibold",
									efficiencyDiff >= -0.5 ? "text-caution" : "text-comparison-neutral",
								)}
							>
								{t.rich("comparisonPercent", {
									percent: (efficiency / mainEfficiency) * 100,
									n: () => <SlidingNumber number={(efficiency / mainEfficiency) * 100} />,
								})}
							</span>
						</div>
						<m.span
							aria-hidden="true"
							variants={LABEL_VARIANTS}
							transition={LABEL_TRANSITION}
							className="invisible text-sm text-comparison-neutral"
						>
							{t("vsMain")}
						</m.span>
					</m.div>
				)}
			</m.div>

			<Button
				disabled={currentSelectionIndex === currentIndex}
				className="flex grow h-11 text-sm cursor-pointer items-center justify-center rounded-[10px] px-4 py-2 font-black transition-colors duration-300"
				onClick={() => onSelectionChange({ suggestion: currentSuggestion, index: currentIndex })}
			>
				{currentSelectionIndex === currentIndex ? t("alreadyApplied") : t("applyAlternative")}
			</Button>
		</div>
	);
}

function Status() {
	const t = useTranslations("ptoStatus");
	const format = useFormatter();
	const resetManualSelection = useHolidaysStore((state) => state.resetManualSelection);
	const askForPlan = useHolidaysStore((state) => state.askForPlan);
	const {
		ptoDays,
		suggested: activeSuggestedCount,
		manual: manualCount,
		spent: usedDays,
		remaining,
		hasManualChanges,
	} = usePlanReadout();
	const handleReset = () => {
		askForPlan();
		resetManualSelection();
		track({ event: "manual_changes_reset", properties: { surface: "panel" } });
	};
	const usedPct = ptoDays > 0 ? Math.min(100, Math.round((usedDays / ptoDays) * 100)) : 0;
	const remainingPct = Math.max(0, 100 - usedPct);

	return (
		<div className="pt-3" data-tutorial={TUTORIAL_ANCHOR.PTO_STATUS}>
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div className="flex items-center gap-4 flex-wrap gap-y-2">
					<div className="flex items-center gap-2 rounded-[10px] border-[3px] border-[var(--frame)] bg-wash-teal-chip px-3 py-1 shadow-[var(--shadow-brutal-xs)]">
						<span className="sr-only">
							{t.rich("suggestedCount", { count: activeSuggestedCount, label: plain, n: plain })}
						</span>
						<div className="size-3 rounded-full bg-suggested-base" aria-hidden="true" />
						{t.rich("suggestedCount", {
							count: activeSuggestedCount,
							label: (chunks) => (
								<span className="text-sm text-muted-foreground" aria-hidden="true">
									{chunks}
								</span>
							),
							n: () => (
								<SlidingNumber
									aria-hidden="true"
									number={activeSuggestedCount}
									className="font-display font-black text-suggested-strong"
								/>
							),
						})}
					</div>
					<div className="flex items-center gap-2 rounded-[10px] border-[3px] border-[var(--frame)] bg-wash-purple-chip px-3 py-1 shadow-[var(--shadow-brutal-xs)]">
						<span className="sr-only">{t.rich("manualCount", { count: manualCount, label: plain, n: plain })}</span>
						<div className="size-3 rounded-full bg-info-base" aria-hidden="true" />
						{t.rich("manualCount", {
							count: manualCount,
							label: (chunks) => (
								<span className="text-sm text-muted-foreground" aria-hidden="true">
									{chunks}
								</span>
							),
							n: () => (
								<SlidingNumber
									aria-hidden="true"
									number={manualCount}
									className="font-display font-black text-manual-strong"
								/>
							),
						})}
					</div>
					<div className="h-8 w-[2px] bg-[var(--frame)]/15 hidden sm:block" />
					<div className="flex flex-col items-center rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel-alt)] px-3 py-1.5 shadow-[var(--shadow-brutal-xs)]">
						<span role="status" className="sr-only">
							{t.rich("remainingCount", { count: remaining, label: plain, n: plain })}
							{remaining === 0 && !hasManualChanges ? ` ${t("allAssigned")}` : ""}
						</span>
						<div className="flex items-center gap-2" aria-hidden="true">
							{t.rich("remainingCount", {
								count: remaining,
								label: (chunks) => (
									<span className="text-sm font-display font-black uppercase tracking-[0.08em]">{chunks}</span>
								),
								n: () => (
									<SlidingNumber
										number={remaining}
										className={cn("font-display font-black", remaining > 0 ? "text-positive" : "text-muted-foreground")}
									/>
								),
							})}
						</div>
						{remaining === 0 && !hasManualChanges && (
							<span
								className="inline-flex items-center gap-1 text-[10px] text-positive-note font-medium"
								aria-hidden="true"
							>
								<Check size={10} strokeWidth={3} />
								{t("allAssigned")}
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={handleReset}
						type="button"
						className={cn("text-xs", !hasManualChanges && "invisible pointer-events-none")}
					>
						{t("resetManual")}
					</Button>
				</div>
			</div>
			<div className="mt-3 space-y-2">
				<Progress value={usedPct === 100 ? 100 : usedPct}>
					<div className="relative h-[22px]">
						<ProgressTrack
							className="h-[22px] rounded-full bg-background shadow-[var(--shadow-brutal-3)] flex items-center"
							indicatorClassName="rounded-full border-r-[3px] border-[var(--frame)]"
							transition={PROGRESS_TRANSITION}
						/>
						<ProgressOverlayLabel overlayClassName="text-[var(--color-brand-ink)]" transition={PROGRESS_TRANSITION}>
							{t("usedDays", {
								used: usedDays,
								total: ptoDays,
								pct: format.number(usedPct / 100, { style: "percent" }),
							})}
						</ProgressOverlayLabel>
					</div>
				</Progress>
				<Progress value={remainingPct}>
					<div className="relative h-[22px]">
						<ProgressTrack
							className="h-[22px] rounded-full bg-background shadow-[var(--shadow-brutal-3)] flex items-center"
							indicatorClassName="rounded-full border-r-[3px] border-[var(--frame)] bg-[var(--color-brand-teal)]"
							transition={PROGRESS_TRANSITION}
						/>
						<ProgressOverlayLabel overlayClassName="text-[var(--color-brand-ink)]" transition={PROGRESS_TRANSITION}>
							{t("remainingDays", { remaining, pct: format.number(remainingPct / 100, { style: "percent" }) })}
						</ProgressOverlayLabel>
					</div>
				</Progress>
			</div>
		</div>
	);
}

export const PlannerPanel = (alternativesProps: AlternativesProps) => (
	<div className="w-full rounded-[10px] border-[3px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-md)]">
		<Alternatives {...alternativesProps} />
		<div className="mt-3 border-t-[2px] border-[var(--frame)]/15" />
		<Status />
	</div>
);
