// stores/holidays.ts
import { HolidayDTO } from '@application/dto/holiday/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { PtoState } from './pto';
import { generateOptimalSuggestions, SuggestionBlock } from './utils/generators';
import { ensureDate } from './utils/helpers';
import { isSameDay } from 'date-fns';

export interface HolidaysState {
  holidays: HolidayDTO[];
  holidaysLoading: boolean;
  suggestedBlocks: SuggestionBlock[];
  suggestionsLoading: boolean;
  alternativeBlocks: Record<string, SuggestionBlock[]>;
  alternativeDaysLoading: boolean;
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
  getSuggestedDaysForMonth: (month: Date) => Date[];
  getAlternativeDaysForBlock: (blockId: string) => Date[];
  clearSuggestions: () => void;
  isDateSuggested: (date: Date) => boolean;
  isDateAlternative: (date: Date, blockId?: string) => boolean;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const initialState: HolidaysState = {
  holidays: [],
  holidaysLoading: false,
  suggestedBlocks: [],
  suggestionsLoading: false,
  alternativeBlocks: {},
  alternativeDaysLoading: false,
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
            // Asegurar que las fechas de holidays sean objetos Date
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
              suggestedBlocks: [],
              alternativeBlocks: {},
            });
            return;
          }

          set({ suggestionsLoading: true });

          try {
            // Asegurar que holidays tengan fechas válidas
            const holidaysWithDates = holidays.map((h) => ({
              ...h,
              date: ensureDate(h.date),
            }));

            const { blocks, alternatives } = generateOptimalSuggestions({
              year,
              ptoDays,
              holidays: holidaysWithDates,
              allowPastDays,
              months,
            });

            set({
              suggestedBlocks: blocks,
              alternativeBlocks: alternatives,
              suggestionsLoading: false,
            });
          } catch (error) {
            console.error('Error generating suggestions:', error);
            set({
              suggestedBlocks: [],
              alternativeBlocks: {},
              suggestionsLoading: false,
            });
          }
        },

        getHolidaysByMonth: (month: number) => {
          const { holidays } = get();
          return holidays.filter((holiday) => {
            const holidayDate = ensureDate(holiday.date);
            const holidayMonth = holidayDate.getMonth() + 1;
            return holidayMonth === month;
          });
        },

        getSuggestedDaysForMonth: (month: Date) => {
          const { suggestedBlocks } = get();
          const monthDays: Date[] = [];

          suggestedBlocks.forEach((block) => {
            block.days.forEach((day) => {
              const dayDate = ensureDate(day);
              if (dayDate.getMonth() === month.getMonth() && dayDate.getFullYear() === month.getFullYear()) {
                monthDays.push(dayDate);
              }
            });
          });

          return monthDays;
        },

        getAlternativeDaysForBlock: (blockId: string) => {
          const { alternativeBlocks } = get();
          const alternatives = alternativeBlocks[blockId] || [];
          const days: Date[] = [];

          alternatives.forEach((block) => {
            block.days.forEach((day) => {
              days.push(ensureDate(day));
            });
          });

          return days;
        },

        clearSuggestions: () => {
          set({
            suggestedBlocks: [],
            alternativeBlocks: {},
          });
        },

        isDateSuggested: (date: Date) => {
          const { suggestedBlocks } = get();
          return suggestedBlocks.some((block) =>
            block.days.some((day) => {
              const dayDate = ensureDate(day);
              return isSameDay(dayDate, date);
            })
          );
        },

        isDateAlternative: (date: Date, blockId?: string) => {
          const { alternativeBlocks } = get();

          if (!blockId) {
            // Verificar si la fecha está en alguna alternativa
            return Object.values(alternativeBlocks).some((blocks) =>
              blocks.some((block) =>
                block.days.some((day) => {
                  const dayDate = ensureDate(day);
                  return isSameDay(dayDate, date);
                })
              )
            );
          }

          // Verificar si la fecha está en las alternativas de un bloque específico
          const alternatives = alternativeBlocks[blockId] || [];
          return alternatives.some((block) =>
            block.days.some((day) => {
              const dayDate = ensureDate(day);
              return isSameDay(dayDate, date);
            })
          );
        },
      }),
      {
        name: 'holidays-store',
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays,
          suggestedBlocks: state.suggestedBlocks,
          alternativeBlocks: state.alternativeBlocks,
        }),
        // Opcional: Añadir onRehydrateStorage para manejar la rehidratación
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convertir strings a Dates cuando se rehidrata el store
            if (state.holidays) {
              state.holidays = state.holidays.map((h) => ({
                ...h,
                date: ensureDate(h.date),
              })); 
            }

            if (state.suggestedBlocks) {
              state.suggestedBlocks = state.suggestedBlocks.map((block) => ({
                ...block,
                days: block.days.map((day) => ensureDate(day)),
              }));
            }

            if (state.alternativeBlocks) {
              Object.keys(state.alternativeBlocks).forEach((key) => {
                state.alternativeBlocks[key] = state.alternativeBlocks[key].map((block) => ({
                  ...block,
                  days: block.days.map((day) => ensureDate(day)),
                }));
              });
            }
          }
        },
      }
    ),
    { name: 'holidays-store' }
  )
);

export const useHolidaysState = () => useHolidaysStore((state) => state);
