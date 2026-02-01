import type { Holiday } from '@domain/calendar/models/types';
import type { FilterStrategy, Suggestion } from '@domain/calendar/models/types';
import type { Locale } from 'next-intl';
import type { FiltersState } from './filters';

export interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  allowPastDays: boolean;
  months: Date[];
  strategy: FilterStrategy;
  locale: Locale;
}

export interface GenerateAlternativesParams extends GenerateSuggestionsParams {
  maxAlternatives?: number;
}

export interface FetchHolidaysParams extends Pick<FiltersState, 'year' | 'country' | 'region' | 'carryOverMonths'> {
  locale: Locale;
}

export interface AddHolidayParams {
  holiday: Omit<Holiday, 'id' | 'variant' | 'isInSelectedRange'>;
  year: FiltersState['year'];
  carryOverMonths: FiltersState['carryOverMonths'];
  locale: Locale;
}

export interface EditHolidayParams {
  holidayId: string;
  locale: Locale;
  updates: Pick<Holiday, 'name' | 'date'>;
}

export interface AlternativeSelectionBaseParams {
  suggestion: Suggestion | null;
  index: number;
}

export interface CryptoParams {
  text: string;
  key: string;
}

export interface GetRegionParams {
  country: string;
  region: string;
}
