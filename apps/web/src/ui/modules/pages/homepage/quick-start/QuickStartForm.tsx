"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useRouter } from "@application/i18n/navigation";
import { useFiltersStore } from "@application/stores/filters";
import { useLocationStore } from "@application/stores/location";
import { useUIStore } from "@application/stores/ui";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@ui/modules/core/animate/base/Dialog";
import { Button } from "@ui/modules/core/primitives/Button";
import { Progress, ProgressTrack } from "@ui/modules/core/primitives/Progress";
import { getUserCountryFromCookie } from "@ui/utils/userCountry";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { QuickStartLocationStep } from "./QuickStartLocationStep";
import { QuickStartPtoDaysStep } from "./QuickStartPtoDaysStep";
import { QuickStartSettingsStep } from "./QuickStartSettingsStep";
import { canLeaveStep, createDraft, QUICK_START_STEPS, type QuickStartDraft, QuickStartStep } from "./steps";

const PLANNER_PATH = "/planner";
const PERCENT = 100;

interface QuickStartFormProps {
	countries: CountryDTO[];
	currentYear: number;
}

export const QuickStartForm = ({ countries, currentYear }: QuickStartFormProps) => {
	const t = useTranslations("quickStart");
	const router = useRouter();
	const closeQuickStart = useUIStore((state) => state.closeQuickStart);
	const { regions, fetchRegions } = useLocationStore(
		useShallow((state) => ({
			regions: state.regions,
			fetchRegions: state.fetchRegions,
		})),
	);
	const [stepIndex, setStepIndex] = useState(0);
	const [draft, setDraft] = useState<QuickStartDraft>(() =>
		createDraft({ filters: useFiltersStore.getState(), detectedCountry: getUserCountryFromCookie() }),
	);

	useEffect(() => {
		if (!draft.country) return;
		fetchRegions(draft.country);
	}, [draft.country, fetchRegions]);

	const step = QUICK_START_STEPS[stepIndex];
	const isFirstStep = stepIndex === 0;
	const isLastStep = stepIndex === QUICK_START_STEPS.length - 1;
	const progress = ((stepIndex + 1) / QUICK_START_STEPS.length) * PERCENT;

	const updateDraft = useCallback((patch: Partial<QuickStartDraft>) => {
		setDraft((previous) => ({ ...previous, ...patch }));
	}, []);

	const goBack = () => setStepIndex((index) => Math.max(0, index - 1));
	const goNext = () => setStepIndex((index) => Math.min(QUICK_START_STEPS.length - 1, index + 1));

	const finish = () => {
		const filters = useFiltersStore.getState();
		filters.setCountry(draft.country);
		filters.setRegion(draft.region);
		filters.setYear(draft.year);
		filters.setPtoDays(draft.ptoDays);
		filters.setStrategy(draft.strategy);
		filters.setAllowPastDays(draft.allowPastDays);
		filters.setCarryOverMonths(draft.carryOverMonths);
		closeQuickStart();
		router.push(PLANNER_PATH);
	};

	return (
		<>
			<DialogHeader>
				<div className="flex items-center justify-between gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
					<span>{t("progress", { current: stepIndex + 1, total: QUICK_START_STEPS.length })}</span>
					<span>{t(`steps.${step}`)}</span>
				</div>
				<Progress value={progress} aria-label={t("title")}>
					<ProgressTrack className="h-3" />
				</Progress>
				<DialogTitle>{t(`${step}.title`)}</DialogTitle>
				<DialogDescription>{t(`${step}.description`)}</DialogDescription>
			</DialogHeader>

			<div key={step} className="py-1">
				{step === QuickStartStep.LOCATION && (
					<QuickStartLocationStep countries={countries} regions={regions} draft={draft} onChange={updateDraft} />
				)}
				{step === QuickStartStep.PTO_DAYS && (
					<QuickStartPtoDaysStep currentYear={currentYear} draft={draft} onChange={updateDraft} />
				)}
				{step === QuickStartStep.SETTINGS && <QuickStartSettingsStep draft={draft} onChange={updateDraft} />}
			</div>

			<DialogFooter className="sm:justify-between">
				<Button type="button" variant="outline" onClick={goBack} disabled={isFirstStep}>
					{t("back")}
				</Button>
				{isLastStep ? (
					<Button type="button" variant="accent" onClick={finish}>
						{t("finish")}
					</Button>
				) : (
					<Button type="button" variant="accent" onClick={goNext} disabled={!canLeaveStep({ step, draft })}>
						{t("next")}
					</Button>
				)}
			</DialogFooter>
		</>
	);
};
