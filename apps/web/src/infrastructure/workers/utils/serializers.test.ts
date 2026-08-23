import type { HolidayDTO } from "@application/dto/holiday/types";
import { HolidayVariant } from "@application/dto/holiday/types";
import type { Bridge, MeasuredSuggestion, Metrics } from "@domain/calendar/types";
import { describe, expect, it } from "vitest";
import {
	deserializeHolidays,
	deserializeSuggestion,
	serializeHolidays,
	serializeSuggestionResult,
} from "./serializers";

const makeHoliday = (date: Date): HolidayDTO => ({
	id: "h-1",
	date,
	name: "New Year",
	variant: HolidayVariant.NATIONAL,
	isInSelectedRange: true,
});

const makeBridge = (): Bridge => ({
	startDate: new Date(2025, 0, 1),
	endDate: new Date(2025, 0, 5),
	ptoDaysNeeded: 2,
	effectiveDays: 5,
	efficiency: 2.5,
	ptoDays: [new Date(2025, 0, 2), new Date(2025, 0, 3)],
});

const EMPTY_METRICS: Metrics = {
	longWeekends: 0,
	restBlocks: 0,
	maxWorkStreak: 0,
	firstLastBreak: null,
	averageEfficiency: 0,
	bonusDays: 0,
	quarterDist: [],
	bridgesUsed: 0,
	workedDaysPerMonth: 0,
	totalEffectiveDays: 0,
	monthlyDist: [],
	longBlocksPerQuarter: [],
	longestVacation: 0,
};

const makeSuggestion = (days: Date[] = [new Date(2025, 2, 10)]): MeasuredSuggestion => ({
	days,
	metrics: EMPTY_METRICS,
});

describe("serializeHolidays", () => {
	it("converts each date to an ISO string", () => {
		const date = new Date(2025, 0, 1);
		const result = serializeHolidays([makeHoliday(date)]);
		expect(result[0].date).toBe(date.toISOString());
	});

	it("preserves all other holiday fields", () => {
		const holiday = makeHoliday(new Date(2025, 0, 1));
		const result = serializeHolidays([holiday]);
		expect(result[0].id).toBe("h-1");
		expect(result[0].name).toBe("New Year");
		expect(result[0].isInSelectedRange).toBe(true);
	});

	it("returns an empty array for empty input", () => {
		expect(serializeHolidays([])).toEqual([]);
	});
});

describe("serializeSuggestionResult", () => {
	it("serializes the main suggestion days to ISO strings", () => {
		const day = new Date(2025, 2, 10);
		const result = serializeSuggestionResult({ suggestion: makeSuggestion([day]), alternatives: [] });
		expect(result.suggestion.days[0]).toBe(day.toISOString());
	});

	it("serializes alternatives", () => {
		const day = new Date(2025, 3, 15);
		const result = serializeSuggestionResult({ suggestion: makeSuggestion(), alternatives: [makeSuggestion([day])] });
		expect(result.alternatives[0].days[0]).toBe(day.toISOString());
	});

	it("serializes bridge dates when present", () => {
		const bridge = makeBridge();
		const suggestion: MeasuredSuggestion = { days: [], bridges: [bridge], metrics: EMPTY_METRICS };
		const result = serializeSuggestionResult({ suggestion, alternatives: [] });
		const serializedBridge = result.suggestion.bridges?.[0];
		expect(serializedBridge?.startDate).toBe(bridge.startDate.toISOString());
		expect(serializedBridge?.endDate).toBe(bridge.endDate.toISOString());
		expect(serializedBridge?.ptoDays[0]).toBe(bridge.ptoDays[0].toISOString());
	});
});

describe("deserializeSuggestion", () => {
	it("converts day ISO strings back to Dates", () => {
		const date = new Date(2025, 2, 10);
		const result = deserializeSuggestion({ days: [date.toISOString()], metrics: EMPTY_METRICS });
		expect(result.days[0]).toBeInstanceOf(Date);
		expect(result.days[0].getFullYear()).toBe(2025);
		expect(result.days[0].getMonth()).toBe(2);
		expect(result.days[0].getDate()).toBe(10);
	});

	it("deserializes bridge dates when present", () => {
		const bridge = makeBridge();
		const serialized = {
			days: [],
			metrics: EMPTY_METRICS,
			bridges: [
				{
					startDate: bridge.startDate.toISOString(),
					endDate: bridge.endDate.toISOString(),
					ptoDaysNeeded: bridge.ptoDaysNeeded,
					effectiveDays: bridge.effectiveDays,
					efficiency: bridge.efficiency,
					ptoDays: bridge.ptoDays.map((day) => day.toISOString()),
				},
			],
		};
		const result = deserializeSuggestion(serialized);
		expect(result.bridges?.[0]?.startDate).toBeInstanceOf(Date);
		expect(result.bridges?.[0]?.ptoDays[0]).toBeInstanceOf(Date);
	});

	it("handles missing bridges gracefully", () => {
		const result = deserializeSuggestion({ days: [], metrics: EMPTY_METRICS });
		expect(result.bridges).toBeUndefined();
	});
});

describe("deserializeHolidays", () => {
	it("converts date ISO strings back to Dates", () => {
		const date = new Date(2025, 0, 1);
		const result = deserializeHolidays([
			{ id: "h-1", date: date.toISOString(), name: "New Year", variant: "national", isInSelectedRange: true },
		]);
		expect(result[0].date).toBeInstanceOf(Date);
		expect(result[0].date.getFullYear()).toBe(2025);
	});

	it("preserves variant and other fields", () => {
		const result = deserializeHolidays([
			{
				id: "h-1",
				date: new Date(2025, 0, 1).toISOString(),
				name: "New Year",
				variant: "national",
				isInSelectedRange: true,
			},
		]);
		expect(result[0].variant).toBe("national");
		expect(result[0].name).toBe("New Year");
	});

	it("returns empty array for empty input", () => {
		expect(deserializeHolidays([])).toEqual([]);
	});
});
