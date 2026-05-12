import type { HolidayDTO } from '../../../application/dto/holiday/types';
import type { Bridge, Suggestion } from '../../services/calendar/types';
import type { SerializedBridge, SerializedHolidayDTO, SerializedSuggestion } from './calculations.types';

export function serializeHolidays(holidays: HolidayDTO[]): SerializedHolidayDTO[] {
  return holidays.map((h) => ({
    ...h,
    date: h.date.toISOString(),
  }));
}

export function serializeMonths(months: Date[]): string[] {
  return months.map((m) => m.toISOString());
}

function serializeBridge(b: Bridge): SerializedBridge {
  return {
    ...b,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    ptoDays: b.ptoDays.map((d) => d.toISOString()),
  };
}

export function serializeSuggestionResult(
  suggestion: Suggestion,
  alternatives: Suggestion[]
): { suggestion: SerializedSuggestion; alternatives: SerializedSuggestion[] } {
  return {
    suggestion: serializeSuggestion(suggestion),
    alternatives: alternatives.map(serializeSuggestion),
  };
}

function serializeSuggestion(s: Suggestion): SerializedSuggestion {
  return {
    ...s,
    days: s.days.map((d) => d.toISOString()),
    bridges: s.bridges?.map(serializeBridge),
  };
}

function deserializeBridge(b: SerializedBridge): Bridge {
  return {
    ...b,
    startDate: new Date(b.startDate),
    endDate: new Date(b.endDate),
    ptoDays: b.ptoDays.map((d) => new Date(d)),
  };
}

export function deserializeSuggestion(s: SerializedSuggestion): Suggestion {
  return {
    ...s,
    days: s.days.map((d) => new Date(d)),
    bridges: s.bridges?.map(deserializeBridge),
    strategy: s.strategy as Suggestion['strategy'],
  };
}

export function deserializeHolidays(holidays: SerializedHolidayDTO[]): HolidayDTO[] {
  return holidays.map((h) => ({
    ...h,
    date: new Date(h.date),
    variant: h.variant as HolidayDTO['variant'],
  }));
}

export function deserializeMonths(months: string[]): Date[] {
  return months.map((m) => new Date(m));
}
