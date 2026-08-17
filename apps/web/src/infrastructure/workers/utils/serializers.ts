import type { HolidayDTO } from '@application/dto/holiday/types';
import { fromStoredInstant } from '@application/shared/utils/dateIntake';
import type { Bridge, MeasuredSuggestion, Suggestion } from '@domain/calendar/types';
import type { SerializedBridge, SerializedHolidayDTO, SerializedSuggestion } from '../types';

export function serializeHolidays(holidays: HolidayDTO[]) {
  return holidays.map((holiday) => ({
    ...holiday,
    date: holiday.date.toISOString(),
  }));
}

function serializeBridge(bridge: Bridge) {
  return {
    ...bridge,
    startDate: bridge.startDate.toISOString(),
    endDate: bridge.endDate.toISOString(),
    ptoDays: bridge.ptoDays.map((day) => day.toISOString()),
  };
}

export function serializeSuggestionResult(suggestion: MeasuredSuggestion, alternatives: MeasuredSuggestion[]) {
  return {
    suggestion: serializeSuggestion(suggestion),
    alternatives: alternatives.map(serializeSuggestion),
  };
}

function serializeSuggestion(suggestion: MeasuredSuggestion) {
  return {
    ...suggestion,
    days: suggestion.days.map((day) => day.toISOString()),
    bridges: suggestion.bridges?.map(serializeBridge),
  };
}

function deserializeBridge(bridge: SerializedBridge) {
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
    strategy: serialized.strategy as Suggestion['strategy'],
  };
}

export function deserializeHolidays(holidays: SerializedHolidayDTO[]) {
  return holidays.map((holiday) => ({
    ...holiday,
    date: fromStoredInstant(holiday.date),
    variant: holiday.variant as HolidayDTO['variant'],
  }));
}
