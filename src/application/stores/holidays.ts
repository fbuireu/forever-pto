import { HolidayDTO } from '@application/dto/holiday/types';
import { getHolidays } from '@infrastructure/services/holidays/getHolidays';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { PtoState } from './pto';

interface HolidaysState {
  holidays: HolidayDTO[];
  holidaysLoading: boolean;
  ptoDays: number;
  suggestions: HolidayDTO[];
  suggestionsLoading: boolean;
  alternativeDays: HolidayDTO[];
  alternativeDaysLoading: boolean;
  currentYear: number;
}

interface GenerateSuggestionsParams {
  country: string;
  year: number;
  ptoDays: number;
}

interface FetchHolidaysParams extends Omit<PtoState, 'ptoDays' | 'allowPastDays'> {
  locale: Locale;
}

interface HolidaysActions {
  fetchHolidays: (params: FetchHolidaysParams) => Promise<void>;
  setPtoDays: (days: number) => void;
  generateSuggestions: (params: GenerateSuggestionsParams) => Promise<void>;
  fetchAlternativeDays: (country: string, year: number) => Promise<void>;
  getHolidaysByMonth: (month: number) => HolidayDTO[];
  getHolidaysByDateRange: (startDate: string, endDate: string) => HolidayDTO[];
  clearSuggestions: () => void;
  addAlternativeDay: (alternativeDay: HolidayDTO) => void;
  removeAlternativeDay: (date: Date) => void;
}

type HolidaysStore = HolidaysState & HolidaysActions;

const initialState: HolidaysState = {
  holidays: [],
  holidaysLoading: false,
  ptoDays: 0,
  suggestions: [],
  suggestionsLoading: false,
  alternativeDays: [],
  alternativeDaysLoading: false,
  currentYear: new Date().getFullYear(),
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

        setPtoDays: (days: number) => {
          set({ ptoDays: days });
        },

        generateSuggestions: async ({ country, year, ptoDays }: GenerateSuggestionsParams) => {
          set({ suggestionsLoading: true });

          try {
            // Replace with your actual API call
            // const suggestions = await generateHolidaySuggestions(country, year, ptoDays);
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
            // Replace with your actual API call
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

        getHolidaysByDateRange: (startDate: string, endDate: string) => {
          const { holidays } = get();
          const start = new Date(startDate);
          const end = new Date(endDate);

          return holidays.filter((holiday) => {
            const holidayDate = new Date(holiday.date);
            return holidayDate >= start && holidayDate <= end;
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
          set({ alternativeDays: alternativeDays.filter((day) => day.date !== date) });
        },
      }),
      {
        name: 'holidays-store',
        storage: encryptedStorage,
        partialize: (state) => ({
          holidays: state.holidays,
          ptoDays: state.ptoDays,
          suggestions: state.suggestions,
          alternativeDays: state.alternativeDays,
          currentYear: state.currentYear,
        }),
      }
    ),
    { name: 'holidays-store' }
  )
);

export const useHolidaysState = () => useHolidaysStore((state) => state);
export const useHolidays = () => useHolidaysStore((state) => state.holidays);
export const useHolidaysLoading = () => useHolidaysStore((state) => state.holidaysLoading);
export const usePtoDays = () => useHolidaysStore((state) => state.ptoDays);
export const useSetPtoDays = () => useHolidaysStore((state) => state.setPtoDays);
export const useSuggestions = () => useHolidaysStore((state) => state.suggestions);
export const useSuggestionsLoading = () => useHolidaysStore((state) => state.suggestionsLoading);
export const useAlternativeDays = () => useHolidaysStore((state) => state.alternativeDays);
export const useAlternativeDaysLoading = () => useHolidaysStore((state) => state.alternativeDaysLoading);
export const useCurrentYear = () => useHolidaysStore((state) => state.currentYear);

export const useFetchHolidays = () => useHolidaysStore((state) => state.fetchHolidays);
export const useGenerateSuggestions = () => useHolidaysStore((state) => state.generateSuggestions);
export const useFetchAlternativeDays = () => useHolidaysStore((state) => state.fetchAlternativeDays);
export const useGetHolidaysByMonth = () => useHolidaysStore((state) => state.getHolidaysByMonth);
export const useGetHolidaysByDateRange = () => useHolidaysStore((state) => state.getHolidaysByDateRange);
export const useClearSuggestions = () => useHolidaysStore((state) => state.clearSuggestions);
export const useAddAlternativeDay = () => useHolidaysStore((state) => state.addAlternativeDay);
export const useRemoveAlternativeDay = () => useHolidaysStore((state) => state.removeAlternativeDay);
