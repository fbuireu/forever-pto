import type { CountryDTO } from '@application/dto/country/types';
import type { RegionDTO } from '@application/dto/region/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getCountries } from '@infrastructure/services/countries/getCountries';
import { getRegions } from '@infrastructure/services/regions/getRegions';
import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { TWENTY_FOUR_HOURS } from './utils';

const logger = getBetterStackInstance();

interface LocationState {
  countries: CountryDTO[];
  countriesLoading: boolean;
  countriesLastFetched: number;
  regions: RegionDTO[];
  regionsLoading: boolean;
}

interface LocationActions {
  fetchCountries: (locale: Locale) => Promise<void>;
  setCountries: (countries: CountryDTO[]) => void;
  getCountryByCode: (code: string) => CountryDTO | undefined;
  fetchRegions: (countryCode: string) => void;
}

type LocationStore = LocationState & LocationActions;

const STORAGE_NAME = 'location-store';
const STORAGE_VERSION = 1;

const locationInitialState: LocationState = {
  countries: [],
  countriesLoading: false,
  countriesLastFetched: 0,
  regions: [],
  regionsLoading: false,
};

export const useLocationStore = create<LocationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...locationInitialState,

        fetchCountries: async (locale: Locale) => {
          const { countriesLastFetched } = get();
          const now = Date.now();

          if (now - countriesLastFetched < TWENTY_FOUR_HOURS) {
            return;
          }

          set({ countriesLoading: true });

          try {
            const countries = await getCountries(locale);
            set({
              countries,
              countriesLastFetched: now,
              countriesLoading: false,
            });
          } catch (error) {
            logger.logError('Error fetching countries in location store', error, {
              locale,
              lastFetched: countriesLastFetched,
              timeSinceLastFetch: now - countriesLastFetched,
            });
            set({ countriesLoading: false });
          }
        },

        setCountries: (countries: CountryDTO[]) => {
          set({
            countries,
            countriesLastFetched: Date.now(),
            countriesLoading: false,
          });
        },

        getCountryByCode: (code: string) => {
          const { countries } = get();
          return countries.find((country) => country.value.toLowerCase() === code.toLowerCase());
        },

        fetchRegions: (countryCode: string) => {
          set({ regions: getRegions(countryCode), regionsLoading: false });
        },
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: encryptedStorage,
        partialize: (state) => ({
          countries: state.countries,
          countriesLastFetched: state.countriesLastFetched,
          regions: state.regions,
        }),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            logger.logError('Error rehydrating location store', error, {
              storeName: STORAGE_NAME,
              hasState: !!state,
            });
            localStorage.removeItem(STORAGE_NAME);
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
