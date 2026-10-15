import type { HolidayDTO } from "@application/dto/holiday/types";
import { fromStoredInstant } from "@application/shared/utils/dateIntake";
import type { Bridge, MeasuredSuggestion } from "@domain/calendar/types";
import type {
	CalculateSuggestionsResultPayload,
	SerializedBridge,
	SerializedHolidayDTO,
	SerializedSuggestion,
} from "@infrastructure/workers/types";

export function serializeHolidays(holidays: HolidayDTO[]): SerializedHolidayDTO[] {
	return holidays.map((holiday) => ({
		...holiday,
		date: holiday.date.toISOString(),
	}));
}

function serializeBridge(bridge: Bridge): SerializedBridge {
	return {
		...bridge,
		startDate: bridge.startDate.toISOString(),
		endDate: bridge.endDate.toISOString(),
		ptoDays: bridge.ptoDays.map((day) => day.toISOString()),
	};
}

export interface SerializeSuggestionResultParams {
	suggestion: MeasuredSuggestion;
	alternatives: MeasuredSuggestion[];
}

export function serializeSuggestionResult({
	suggestion,
	alternatives,
}: SerializeSuggestionResultParams): CalculateSuggestionsResultPayload {
	return {
		suggestion: serializeSuggestion(suggestion),
		alternatives: alternatives.map(serializeSuggestion),
	};
}

function serializeSuggestion(suggestion: MeasuredSuggestion): SerializedSuggestion {
	return {
		...suggestion,
		days: suggestion.days.map((day) => day.toISOString()),
		bridges: suggestion.bridges?.map(serializeBridge),
	};
}

function deserializeBridge(bridge: SerializedBridge): Bridge {
	return {
		...bridge,
		startDate: fromStoredInstant(bridge.startDate),
		endDate: fromStoredInstant(bridge.endDate),
		ptoDays: bridge.ptoDays.map(fromStoredInstant),
	};
}

export function deserializeSuggestion(serialized: SerializedSuggestion): MeasuredSuggestion {
	return {
		...serialized,
		days: serialized.days.map(fromStoredInstant),
		bridges: serialized.bridges?.map(deserializeBridge),
		strategy: serialized.strategy,
	};
}

export function deserializeHolidays(holidays: SerializedHolidayDTO[]): HolidayDTO[] {
	return holidays.map((holiday) => ({
		...holiday,
		date: fromStoredInstant(holiday.date),
	}));
}
