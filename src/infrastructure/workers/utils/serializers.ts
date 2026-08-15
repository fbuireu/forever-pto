import type { HolidayDTO } from '@application/dto/holiday/types';
import type { Bridge, Suggestion } from '@domain/calendar/types';
import type { SerializedBridge, SerializedHolidayDTO, SerializedSuggestion } from '../types';

export function serializeHolidays(holidays: HolidayDTO[]) {
  return holidays.map((holiday) => ({
    ...holiday,
    date: holiday.date.toISOString(),
  }));
}

export function serializeMonths(months: Date[]) {
  return months.map((month) => month.toISOString());
}

function serializeBridge(bridge: Bridge) {
  return {
    ...bridge,
    startDate: bridge.startDate.toISOString(),
    endDate: bridge.endDate.toISOString(),
    ptoDays: bridge.ptoDays.map((day) => day.toISOString()),
  };
}

export function serializeSuggestionResult(suggestion: Suggestion, alternatives: Suggestion[]) {
  return {
    suggestion: serializeSuggestion(suggestion),
    alternatives: alternatives.map(serializeSuggestion),
  };
}

function serializeSuggestion(suggestion: Suggestion) {
  return {
    ...suggestion,
    days: suggestion.days.map((day) => day.toISOString()),
    bridges: suggestion.bridges?.map(serializeBridge),
  };
}

function deserializeBridge(bridge: SerializedBridge) {
  return {
    ...bridge,
    startDate: new Date(bridge.startDate),
    endDate: new Date(bridge.endDate),
    ptoDays: bridge.ptoDays.map((day) => new Date(day)),
  };
}

export function deserializeSuggestion(serialized: SerializedSuggestion) {
  return {
    ...serialized,
    days: serialized.days.map((day) => new Date(day)),
    bridges: serialized.bridges?.map(deserializeBridge),
    strategy: serialized.strategy as Suggestion['strategy'],
  };
}

export function deserializeHolidays(holidays: SerializedHolidayDTO[]) {
  return holidays.map((holiday) => ({
    ...holiday,
    date: new Date(holiday.date),
    variant: holiday.variant as HolidayDTO['variant'],
  }));
}

export function deserializeMonths(months: string[]) {
  return months.map((month) => new Date(month));
}
