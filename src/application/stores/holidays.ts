import type { HolidayDTO } from '@application/dto/holiday/types';
import {
  generateAlternatives,
  getAlternativesForBlock,
} from '@infrastructure/services/calendar/alternatives/generateAlternatives';
import { generateSuggestions } from '@infrastructure/services/calendar/suggestions/generateSuggestions';
import { AlternativeBlock, SuggestionBlock } from '@infrastructure/services/calendar/suggestions/types';
import { generateBlockOpportunities } from '@infrastructure/services/calendar/suggestions/utils/generateBlockOpportunities';
import { getAvailableWorkdays } from '@infrastructure/services/calendar/suggestions/utils/getWorkdays';
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
  alternatives: Map<string, AlternativeBlock[]>;
  alternativesLoading: boolean;
  suggestedDates: Set<string>;
  alternativeDates: Map<string, string>;
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
  getAlternativesForBlock: (blockId: string) => AlternativeBlock[];
  clearSuggestions: () => void;
  isDateSuggested: (date: Date) => boolean;
  getDateInfo: (date: Date) => {
    isSuggested: boolean;
    isAlternative: boolean;
    suggestionBlockId?: string;
    alternativeForBlockId?: string;
  };
}

type HolidaysStore = HolidaysState & HolidaysActions;

const initialState: HolidaysState = {
  holidays: [],
  holidaysLoading: false,
  suggestions: [],
  suggestionsLoading: false,
  alternatives: new Map(),
  alternativesLoading: false,
  suggestedDates: new Set(),
  alternativeDates: new Map(),
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
              alternatives: new Map(),
              suggestedDates: new Set(),
              alternativeDates: new Map(),
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

            const availableWorkdays = getAvailableWorkdays({
              months,
              holidays: holidaysDates,
              allowPastDays,
            });

            const maxBlockSize = Math.max(...blocks.map((b) => b.ptoDays), 3) + 2;
            const allOpportunities = generateBlockOpportunities({
              availableWorkdays,
              holidays: holidaysDates,
              maxBlockSize,
            });

            const alternativesMap = generateAlternatives({
              selectedBlocks: blocks,
              allOpportunities,
            });
            console.log('alter', alternativesMap);
            // Build alternative dates lookup
            const alternativeDates = new Map<string, string>();
            alternativesMap.forEach((alts, blockId) => {
              alts.forEach((alt) => {
                alt.days.forEach((day) => {
                  alternativeDates.set(getDateKey(day), alt.alternativeFor);
                });
              });
            });

            set({
              suggestions: blocks,
              alternatives: alternativesMap,
              suggestedDates,
              alternativeDates,
              suggestionsLoading: false,
              alternativesLoading: false,
            });
          } catch (error) {
            console.error('Error generating suggestions:', error);
            set({
              suggestions: [],
              alternatives: new Map(),
              suggestedDates: new Set(),
              alternativeDates: new Map(),
              suggestionsLoading: false,
              alternativesLoading: false,
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

        getAlternativesForBlock: (blockId: string) => {
          const { alternatives } = get();
          return getAlternativesForBlock(blockId, alternatives);
        },

        clearSuggestions: () => {
          set({
            suggestions: [],
            alternatives: new Map(),
            suggestedDates: new Set(),
            alternativeDates: new Map(),
          });
        },

        isDateSuggested: (date: Date) => {
          const { suggestedDates } = get();
          return suggestedDates.has(getDateKey(date));
        },

        getDateInfo: (date: Date) => {
          const { suggestedDates, alternativeDates, suggestions } = get();
          const dateKey = getDateKey(date);

          const isSuggested = suggestedDates.has(dateKey);
          const alternativeForBlockId = alternativeDates.get(dateKey);

          // Find suggestion block ID if date is suggested
          let suggestionBlockId: string | undefined;
          if (isSuggested) {
            const block = suggestions.find((s) => s.days.some((d) => getDateKey(d) === dateKey));
            suggestionBlockId = block?.id;
          }

          return {
            isSuggested,
            isAlternative: !!alternativeForBlockId,
            suggestionBlockId,
            alternativeForBlockId,
          };
        },
      }),
      {
        name: 'holidays-store',
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays,
          suggestions: state.suggestions,
          alternatives: Array.from(state.alternatives.entries()),
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

            if (Array.isArray(state.alternatives)) {
              const alternativeDates = new Map<string, string>();
              const newAlternatives = new Map<string, AlternativeBlock[]>();

              for (const [key, alts] of state.alternatives as [string, AlternativeBlock[]][]) {
                const processedAlts: AlternativeBlock[] = alts.map((alt) => {
                  const days = alt.days.map(ensureDate);

                  days.forEach((day) => {
                    alternativeDates.set(getDateKey(day), alt.alternativeFor);
                  });

                  return {
                    ...alt,
                    days,
                    metadata: alt.metadata
                  };
                });

                newAlternatives.set(key, processedAlts);
              }

              state.alternatives = newAlternatives;
              state.alternativeDates = alternativeDates;
            }
          }
        },
      }
    ),
    { name: 'holidays-store' }
  )
);

export const useHolidaysState = () => useHolidaysStore((state) => state);
