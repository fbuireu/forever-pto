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

function plannerGeneratedProperties({ params, measured, alternatives }: PlannerGeneratedParams) {
	const { metrics } = measured;

	return {
		ptoDays: params.ptoDays,
		strategy: params.strategy,
		preferredMonths: params.preferredMonths.join(","),
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
	const lastRequestIdRef = useRef(0);
	const inFlightRequestIdRef = useRef<string | null>(null);
	const queuedRunRef = useRef<(() => void) | null>(null);
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
			const settle = () => {
				inFlightRequestIdRef.current = null;
				const queuedRun = queuedRunRef.current;
				queuedRunRef.current = null;
				if (queuedRun) {
					queuedRun();
					return true;
				}
				setCalculating(false);
				return false;
			};

			const run = () => {
				workerRef.current ??= new Worker(new URL("../../infrastructure/workers/worker", import.meta.url));
				const worker = workerRef.current;

				lastRequestIdRef.current += 1;
				const requestId = String(lastRequestIdRef.current);
				inFlightRequestIdRef.current = requestId;

				setCalculating(true);

				worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
					if (e.data.requestId !== inFlightRequestIdRef.current) return;
					if (settle()) return;
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
					if (inFlightRequestIdRef.current !== requestId) return;
					worker.terminate();
					if (workerRef.current === worker) workerRef.current = null;
					settle();
				};

				worker.onmessageerror = () => {
					if (inFlightRequestIdRef.current !== requestId) return;
					settle();
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
						preferredMonths: params.preferredMonths,
						locale: params.locale,
						maxAlternatives,
						manualDays: manuallySelectedDays.map((d) => d.toISOString()),
						removedDays: removedSuggestedDays.map((d) => d.toISOString()),
						autoSuggestCount,
					},
				};

				worker.postMessage(request);
			};

			if (inFlightRequestIdRef.current !== null) {
				queuedRunRef.current = run;
				return;
			}
			run();
		},
		[setCalculating, setCalculationResult, holidays, maxAlternatives],
	);

	useEffect(() => {
		return () => {
			if (inFlightRequestIdRef.current !== null) {
				useHolidaysStore.getState().setCalculating(false);
			}
			inFlightRequestIdRef.current = null;
			queuedRunRef.current = null;
			workerRef.current?.terminate();
			workerRef.current = null;
		};
	}, []);

	return { triggerCalculation };
}
