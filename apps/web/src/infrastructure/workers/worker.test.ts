import type { PlanningResult, runPlanningPipeline } from "@domain/calendar/pipeline";
import { FilterStrategy, type MeasuredSuggestion, type Metrics } from "@domain/calendar/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CalculateSuggestionsRequest } from "./types";
import { WORKER_MESSAGE_TYPE } from "./types";

const METRICS: Metrics = {
	longWeekends: 0,
	restBlocks: 0,
	maxWorkStreak: 0,
	firstLastBreak: null,
	averageEfficiency: 2,
	bonusDays: 0,
	quarterDist: [],
	bridgesUsed: 0,
	workedDaysPerMonth: 0,
	totalEffectiveDays: 7,
	monthlyDist: [],
	longBlocksPerQuarter: [],
	longestVacation: 0,
};

const measured = (days: Date[]): MeasuredSuggestion => ({
	days,
	bridges: [],
	strategy: FilterStrategy.GROUPED,
	metrics: METRICS,
});

const mockRunPlanningPipeline = vi.hoisted(() => vi.fn<typeof runPlanningPipeline>());
const mockPostMessage = vi.hoisted(() => vi.fn());

vi.mock("@domain/calendar/pipeline", () => ({ runPlanningPipeline: mockRunPlanningPipeline }));

vi.stubGlobal("self", { postMessage: mockPostMessage });

await import("./worker");

const sendMessage = (payload: Partial<CalculateSuggestionsRequest["payload"]> = {}) => {
	const message: CalculateSuggestionsRequest = {
		type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS,
		requestId: "req-1",
		payload: {
			year: 2025,
			ptoDays: 5,
			holidays: [
				{
					id: "h-1",
					date: new Date(2025, 0, 1).toISOString(),
					name: "New Year",
					variant: "national",
					isInSelectedRange: true,
				},
			],
			allowPastDays: false,
			carryOverMonths: 0,
			strategy: "grouped",
			locale: "en",
			maxAlternatives: 3,
			manualDays: [],
			...payload,
		},
	};
	(globalThis.onmessage as ((e: MessageEvent<CalculateSuggestionsRequest>) => void) | null)?.({
		data: message,
	} as MessageEvent<CalculateSuggestionsRequest>);
};

const planningInput = () => mockRunPlanningPipeline.mock.lastCall?.[0];

describe("worker onmessage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRunPlanningPipeline.mockReturnValue({
			planned: true,
			suggestion: measured([new Date(2025, 2, 10)]),
			alternatives: [],
		});
	});

	it("ignores messages with unknown type", () => {
		(globalThis.onmessage as ((e: MessageEvent) => void) | null)?.({
			data: { type: "UNKNOWN", requestId: "r", payload: {} },
		} as MessageEvent);

		expect(mockRunPlanningPipeline).not.toHaveBeenCalled();
		expect(mockPostMessage).not.toHaveBeenCalled();
	});

	it("posts CALCULATE_SUGGESTIONS_RESULT on success", () => {
		sendMessage();
		expect(mockPostMessage).toHaveBeenCalledOnce();
		const response = mockPostMessage.mock.calls[0][0];
		expect(response.type).toBe(WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT);
		expect(response.requestId).toBe("req-1");
	});

	it("serializes suggestion days to ISO strings in the response", () => {
		sendMessage();
		const response = mockPostMessage.mock.calls[0][0];
		expect(typeof response.payload.suggestion.days[0]).toBe("string");
	});

	it("carries the pipeline's own Metrics onto the wire rather than a literal of its own", () => {
		mockRunPlanningPipeline.mockReturnValue({
			planned: false,
			suggestion: measured([]),
			alternatives: [],
		} satisfies PlanningResult);

		sendMessage({ ptoDays: 0 });

		const response = mockPostMessage.mock.calls[0][0];
		expect(response.type).toBe(WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT);
		expect(response.payload.suggestion.days).toEqual([]);
		expect(response.payload.suggestion.metrics).toEqual(METRICS);
	});

	it("deserialises the Holidays into the PlanningInput as Dates", () => {
		const date = new Date(2025, 0, 1);
		sendMessage();

		expect(planningInput()?.holidays).toEqual([
			{ id: "h-1", date, name: "New Year", variant: "national", isInSelectedRange: true },
		]);
	});

	it("deserialises the hand-edited days into the two lists the pipeline names them by", () => {
		const manual = new Date(2025, 2, 5);
		const removed = new Date(2025, 2, 20);
		sendMessage({ manualDays: [manual.toISOString()], removedDays: [removed.toISOString()] });

		expect(planningInput()?.manuallySelectedDays).toEqual([manual]);
		expect(planningInput()?.removedSuggestedDays).toEqual([removed]);
	});

	it("defaults both hand-edited lists to empty when the request omits them", () => {
		sendMessage({ manualDays: undefined as never, removedDays: undefined });

		expect(planningInput()?.manuallySelectedDays).toEqual([]);
		expect(planningInput()?.removedSuggestedDays).toEqual([]);
	});

	it("builds the Planning Window out of the request's year and carryOverMonths", () => {
		sendMessage({ year: 2026, carryOverMonths: 3 });

		expect(planningInput()?.window).toEqual({ year: 2026, carryOverMonths: 3 });
	});

	it("forwards the budget, the auto-suggest cap and the rest of the request verbatim", () => {
		sendMessage({ ptoDays: 10, autoSuggestCount: 3, allowPastDays: true, maxAlternatives: 2 });

		expect(planningInput()).toMatchObject({
			ptoDays: 10,
			autoSuggestCount: 3,
			allowPastDays: true,
			maxAlternatives: 2,
		});
	});

	it("passes a recognised strategy through to the pipeline", () => {
		sendMessage({ strategy: "optimized" });
		expect(planningInput()?.strategy).toBe(FilterStrategy.OPTIMIZED);
	});

	it("replaces an unrecognised strategy with the default, so the pipeline never dispatches on a bad string", () => {
		sendMessage({ strategy: "balanced-ish" as never });
		expect(planningInput()?.strategy).toBe(FilterStrategy.GROUPED);
	});

	it("replaces an unrecognised locale with English, since the Metrics format month names with it", () => {
		sendMessage({ locale: "es" });
		expect(planningInput()?.locale).toBe("es");

		sendMessage({ locale: "xx" });
		expect(planningInput()?.locale).toBe("en");
	});

	it("posts WORKER_ERROR when the pipeline throws", () => {
		mockRunPlanningPipeline.mockImplementation(() => {
			throw new Error("pipeline crash");
		});

		sendMessage();

		const response = mockPostMessage.mock.calls[0][0];
		expect(response.type).toBe(WORKER_MESSAGE_TYPE.WORKER_ERROR);
		expect(response.requestId).toBe("req-1");
		expect(response.error).toContain("pipeline crash");
	});
});
