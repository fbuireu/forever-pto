import type { HolidayDTO } from '@application/dto/holiday/types';
import type { FilterStrategy, Suggestion } from '@infrastructure/services/calendar/types';
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

export interface FetchHolidaysParams extends Pick<FiltersState, 'year' | 'country' | 'region'> {
  locale: Locale;
}

export interface AddHolidayParams {
  holiday: Omit<HolidayDTO, 'id' | 'variant'>;
  locale: Locale;
}

export interface EditHolidayParams {
  holidayId: string;
  locale: Locale;
  updates: Pick<HolidayDTO, 'name' | 'date'>;
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
