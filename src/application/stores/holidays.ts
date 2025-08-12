import type { HolidayDTO } from '@application/dto/holiday/types';
import { generateSuggestions } from '@infrastructure/services/calendar/suggestions/generateSuggestions';
import { SuggestionBlock } from '@infrastructure/services/calendar/suggestions/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { ensureDate } from '@shared/utils/dates';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { PtoState } from './pto';
import { getDateKey } from './utils/helpers';

export interface HolidaysState {
  holidays: HolidayDTO[];
  holidaysLoading: boolean;
  suggestions: SuggestionBlock[];
  suggestionsLoading: boolean;
  suggestedDates: Set<string>;
}

interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  allowPastDays: boolean;
  months: Date[];
}

interface FetchHolidaysParams extends Omit<PtoState, 'ptoDays' | 'allowPastDays' | 'carryOverMonths'> {
  locale: Locale;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: GenerateSuggestionsParams) => void;
  getHolidaysByMonth: (month: number) => HolidayDTO[];
  clearSuggestions: () => void;
  isDateSuggested: (date: Date) => boolean;
  getDateInfo: (date: Date) => {
    isSuggested: boolean;
    suggestionBlockId?: string;
  };
}

type HolidaysStore = HolidaysState & HolidaysActions;

const initialState: HolidaysState = {
  holidays: [],
  holidaysLoading: false,
  suggestions: [],
  suggestionsLoading: false,
  suggestedDates: new Set(),
};

export const useHolidaysStore = create<HolidaysStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchHolidays: async (params: FetchHolidaysParams) => {
          set({ holidaysLoading: true });
          try {
            const holidays = await getHolidays(params);
            const holidaysWithDates = holidays.map((h) => ({
              ...h,
              date: ensureDate(h.date),
            }));
            set({
              holidays: holidaysWithDates,
              holidaysLoading: false,
            });
          } catch (error) {
            set({
              holidaysLoading: false,
              holidays: [],
            });
          }
        },

        generateSuggestions: ({ year, ptoDays, allowPastDays, months }: GenerateSuggestionsParams) => {
          const { holidays } = get();

          if (ptoDays <= 0 || holidays.length === 0) {
            set({
              suggestions: [],
              suggestedDates: new Set(),
            });
            return;
          }

          set({ suggestionsLoading: true });

          try {
            const holidaysDates = holidays.map((h) => ({
              ...h,
              date: ensureDate(h.date),
            }));

            const { blocks } = generateSuggestions({
              year,
              ptoDays,
              holidays: holidaysDates,
              allowPastDays,
              months,
            });

            const suggestedDates = new Set<string>();
            blocks.forEach((block) => {
              block.days.forEach((day) => {
                suggestedDates.add(getDateKey(day));
              });
            });

            set({
              suggestions: blocks,
              suggestedDates,
              suggestionsLoading: false,
            });
          } catch (error) {
            console.error('Error generating suggestions:', error);
            set({
              suggestions: [],
              suggestedDates: new Set(),
              suggestionsLoading: false,
            });
          }
        },

        getHolidaysByMonth: (month: number) => {
          const { holidays } = get();
          return holidays.filter((holiday) => {
            const holidayDate = ensureDate(holiday.date);
            return holidayDate.getMonth() + 1 === month;
          });
        },

        clearSuggestions: () => {
          set({
            suggestions: [],
            suggestedDates: new Set(),
          });
        },

        isDateSuggested: (date: Date) => {
          const { suggestedDates } = get();
          return suggestedDates.has(getDateKey(date));
        },

        getDateInfo: (date: Date) => {
          const { suggestedDates, suggestions } = get();
          const dateKey = getDateKey(date);

          const isSuggested = suggestedDates.has(dateKey);

          let suggestionBlockId: string | undefined;
          if (isSuggested) {
            const block = suggestions.find((s) => s.days.some((d) => getDateKey(d) === dateKey));
            suggestionBlockId = block?.id;
          }

          return {
            isSuggested,
            suggestionBlockId,
          };
        },
      }),
      {
        name: 'holidays-store',
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays,
          suggestions: state.suggestions,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            if (state.holidays) {
              state.holidays = state.holidays.map((h) => ({
                ...h,
                date: ensureDate(h.date),
              }));
            }

            if (state.suggestions) {
              const suggestedDates = new Set<string>();
              state.suggestions = state.suggestions.map((block) => {
                const updatedBlock = {
                  ...block,
                  days: block.days.map(ensureDate),
                };
                updatedBlock.days.forEach((day) => {
                  suggestedDates.add(getDateKey(day));
                });
                return updatedBlock;
              });
              state.suggestedDates = suggestedDates;
            }
          }
        },
      }
    ),
    { name: 'holidays-store' }
  )
);

export const useHolidaysState = () => useHolidaysStore((state) => state);
