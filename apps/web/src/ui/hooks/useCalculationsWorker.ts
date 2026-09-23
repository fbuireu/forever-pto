"use client";

import { useHolidaysStore } from "@application/stores/holidays";
import type { GenerateSuggestionsParams } from "@application/stores/types";
import type { MeasuredSuggestion } from "@domain/calendar/types";
import { measureBudget } from "@domain/calendar/utils/budget";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import {
	type CalculateSuggestionsRequest,
	WORKER_MESSAGE_TYPE,
	type WorkerResponse,
} from "@infrastructure/workers/types";
import { deserializeSuggestion, serializeHolidays } from "@infrastructure/workers/utils/serializers";
import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

interface PlannerGeneratedParams {
	params: GenerateSuggestionsParams;
	measured: MeasuredSuggestion;
	alternatives: readonly unknown[];
}

export function plannerGeneratedProperties({ params, measured, alternatives }: PlannerGeneratedParams) {
	const { metrics } = measured;

	return {
		ptoDays: params.ptoDays,
		strategy: params.strategy,
		year: params.year,
		carryOverMonths: params.carryOverMonths,
		allowPastDays: params.allowPastDays,
		alternatives: alternatives.length,
		averageEfficiency: metrics.averageEfficiency,
		totalEffectiveDays: metrics.totalEffectiveDays,
		bonusDays: metrics.bonusDays,
		longWeekends: metrics.longWeekends,
		restBlocks: metrics.restBlocks,
		longestVacation: metrics.longestVacation,
		maxWorkStreak: metrics.maxWorkStreak,
	};
}

export function useCalculationsWorker() {
	const workerRef = useRef<Worker | null>(null);
	const currentRequestIdRef = useRef<string>("");
	const pendingRequestIdRef = useRef<string | null>(null);
	const lastCalculatedPtoDaysRef = useRef<number | null>(null);

	const { setCalculating, setCalculationResult, holidays, maxAlternatives } = useHolidaysStore(
		useShallow((state) => ({
			setCalculating: state.setCalculating,
			setCalculationResult: state.setCalculationResult,
			holidays: state.holidays,
			maxAlternatives: state.maxAlternatives,
		})),
	);

	const triggerCalculation = useCallback(
		(params: GenerateSuggestionsParams) => {
			workerRef.current?.terminate();

			const worker = new Worker(new URL("../../infrastructure/workers/worker", import.meta.url));
			workerRef.current = worker;

			const requestId = String(Date.now());
			currentRequestIdRef.current = requestId;
			pendingRequestIdRef.current = requestId;

			setCalculating(true);

			worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
				if (e.data.requestId !== currentRequestIdRef.current) return;
				pendingRequestIdRef.current = null;
				setCalculating(false);
				if (e.data.type === WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT) {
					lastCalculatedPtoDaysRef.current = params.ptoDays;
					const { suggestion, alternatives } = e.data.payload;
					const measured = deserializeSuggestion(suggestion);
					setCalculationResult({
						suggestion: measured,
						alternatives: alternatives.map(deserializeSuggestion),
					});
					track({
						event: "planner_generated",
						properties: plannerGeneratedProperties({ params, measured, alternatives }),
					});
				}
			};

			worker.onerror = () => {
				if (currentRequestIdRef.current === requestId) {
					pendingRequestIdRef.current = null;
					setCalculating(false);
				}
			};

			worker.onmessageerror = () => {
				if (currentRequestIdRef.current === requestId) {
					pendingRequestIdRef.current = null;
					setCalculating(false);
				}
			};

			const { removedSuggestedDays, currentSelection, manuallySelectedDays } = useHolidaysStore.getState();

			const budgetForAutoSuggest = measureBudget({ ptoDays: params.ptoDays, manuallySelectedDays }).remaining;
			const hasRemovedDays = removedSuggestedDays.length > 0;
			const activeSuggestedDays =
				currentSelection && hasRemovedDays
					? Math.max(0, currentSelection.days.length - removedSuggestedDays.length)
					: undefined;

			const ptoDaysChanged =
				lastCalculatedPtoDaysRef.current !== null && lastCalculatedPtoDaysRef.current !== params.ptoDays;
			const cap =
				!ptoDaysChanged && activeSuggestedDays !== undefined
					? Math.min(budgetForAutoSuggest, activeSuggestedDays)
					: undefined;
			const autoSuggestCount = cap && cap > 0 ? cap : undefined;

			const request: CalculateSuggestionsRequest = {
				type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS,
				requestId,
				payload: {
					year: params.year,
					carryOverMonths: params.carryOverMonths,
					ptoDays: params.ptoDays,
					holidays: serializeHolidays(holidays),
					allowPastDays: params.allowPastDays,
					strategy: params.strategy,
					locale: params.locale,
					maxAlternatives,
					manualDays: manuallySelectedDays.map((d) => d.toISOString()),
					removedDays: removedSuggestedDays.map((d) => d.toISOString()),
					autoSuggestCount,
				},
			};

			worker.postMessage(request);
		},
		[setCalculating, setCalculationResult, holidays, maxAlternatives],
	);

	useEffect(() => {
		return () => {
			if (pendingRequestIdRef.current) {
				useHolidaysStore.getState().setCalculating(false);
			}
			workerRef.current?.terminate();
		};
	}, []);

	return { triggerCalculation };
}
