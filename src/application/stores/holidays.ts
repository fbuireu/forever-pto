import { HolidayDTO } from '@application/dto/holiday/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { PtoState } from './pto';

export interface HolidaysState {
  holidays: HolidayDTO[];
  holidaysLoading: boolean;
  suggestions: HolidayDTO[];
  suggestionsLoading: boolean;
  alternativeDays: HolidayDTO[];
  alternativeDaysLoading: boolean;
}

interface GenerateSuggestionsParams {
  country: string;
  year: number;
}

interface FetchHolidaysParams extends Omit<PtoState, 'ptoDays' | 'allowPastDays' | 'carryOverMonths'> {
  locale: Locale;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  generateSuggestions: (params: GenerateSuggestionsParams) => Promise<void>;
  fetchAlternativeDays: (country: string, year: number) => Promise<void>;
  getHolidaysByMonth: (month: number) => HolidayDTO[];
  clearSuggestions: () => void;
  addAlternativeDay: (alternativeDay: HolidayDTO) => void;
  removeAlternativeDay: (date: Date) => void;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const initialState: HolidaysState = {
  holidays: [],
  holidaysLoading: false,
  suggestions: [],
  suggestionsLoading: false,
  alternativeDays: [],
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

            set({
              holidays,
              holidaysLoading: false,
            });
          } catch (error) {
            set({
              holidaysLoading: false,
              holidays: [],
            });
          }
        },

        generateSuggestions: async ({ country, year }: GenerateSuggestionsParams) => {
          set({ suggestionsLoading: true });

          try {
            // const suggestions = await generateHolidaySuggestions(country, year);
            const suggestions: HolidayDTO[] = []; // Placeholder

            set({
              suggestions,
              suggestionsLoading: false,
            });
          } catch (error) {
            set({
              suggestionsLoading: false,
              suggestions: [],
            });
          }
        },

        fetchAlternativeDays: async (country: string, year: number) => {
          set({ alternativeDaysLoading: true });

          try {
            // const alternativeDays = await getAlternativeDays(country, year);
            const alternativeDays: HolidayDTO[] = []; // Placeholder

            set({
              alternativeDays,
              alternativeDaysLoading: false,
            });
          } catch (error) {
            set({
              alternativeDaysLoading: false,
              alternativeDays: [],
            });
          }
        },

        getHolidaysByMonth: (month: number) => {
          const { holidays } = get();
          return holidays.filter((holiday) => {
            const holidayMonth = new Date(holiday.date).getMonth() + 1;
            return holidayMonth === month;
          });
        },

        clearSuggestions: () => {
          set({ suggestions: [] });
        },

        addAlternativeDay: (alternativeDay: HolidayDTO) => {
          const { alternativeDays } = get();
          set({ alternativeDays: [...alternativeDays, alternativeDay] });
        },

        removeAlternativeDay: (date: Date) => {
          const { alternativeDays } = get();
          set({
            alternativeDays: alternativeDays.filter((day) => {
              const dayDate = new Date(day.date);
              return dayDate.getTime() !== date.getTime();
            }),
          });
        },
      }),
      {
        name: 'holidays-store',
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays,
          suggestions: state.suggestions,
          alternativeDays: state.alternativeDays,
        }),
      }
    ),
    { name: 'holidays-store' }
  )
);

export const useHolidaysState = () => useHolidaysStore((state) => state);
