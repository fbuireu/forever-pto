import type { CountryDTO } from '@application/dto/country/types';
import type { RegionDTO } from '@application/dto/region/types';
import { getCountries } from '@infrastructure/services/countries/getCountries';
import { getRegions } from '@infrastructure/services/regions/getRegions';
import type { Locale } from 'next-intl';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { createEncryptedStorage } from './crypto';
import { GetRegionParams } from './types';

export interface LocationState {
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
  fetchRegions: (countryCode: string) => Promise<void>;
  getRegion: ({ region }: GetRegionParams) => RegionDTO | undefined;
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

          if (now - countriesLastFetched < 24 * 60 * 60 * 1000) {
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
            console.warn('Error in fetchCountries:', error);
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

        fetchRegions: async (countryCode: string) => {
          set({ regionsLoading: true });

          try {
            const regionData = getRegions(countryCode);
            set({
              regions: regionData,
              regionsLoading: false,
            });
          } catch (error) {
            console.warn('Error in fetchRegions:', error);
            set({
              regionsLoading: false,
              regions: [],
            });
          }
        },

        getRegion: ({ region }: GetRegionParams) => {
          const { regions } = get();
          return regions.find((item) => item.value.toLowerCase() === region.toLowerCase());
        },
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: createJSONStorage(
          () => createEncryptedStorage({ storeName: STORAGE_NAME, version: STORAGE_VERSION }).storage
        ),
        partialize: (state) => ({
          countries: state.countries,
          countriesLastFetched: state.countriesLastFetched,
          regions: state.regions,
        }),
      }
    ),
    { name: STORAGE_NAME }
  )
);
