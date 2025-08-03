import { CountryDTO } from '@application/dto/country/types';
import { RegionDTO } from '@application/dto/region/types';
import { getCountries } from '@infrastructure/services/countries/getCountries';
import { getRegions } from '@infrastructure/services/regions/getRegions';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';

interface LocationState {
  countries: CountryDTO[];
  countriesLoading: boolean;
  countriesLastFetched: number;
  regions: RegionDTO[];
  regionsLoading: boolean;
}

interface GetRegionParams {
  country: string;
  region: string;
}

interface LocationActions {
  fetchCountries: (locale: Locale) => Promise<void>;
  setCountries: (countries: CountryDTO[]) => void; 
  getCountryByCode: (code: string) => CountryDTO | undefined;
  fetchRegions: (countryCode: string) => Promise<void>;
  getRegion: ({ region }: GetRegionParams) => RegionDTO | undefined;
}

type LocationStore = LocationState & LocationActions;

const initialState: LocationState = {
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
        ...initialState,

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
            set({
              countriesLoading: false,
            });
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
        name: 'location-store',
        storage: encryptedStorage,
        partialize: (state) => ({
          countries: state.countries,
          countriesLastFetched: state.countriesLastFetched,
          regions: state.regions,
        }),
      }
    ),
    { name: 'location-store' }
  )
);

export const useLocationState = () => useLocationStore((state) => state);
export const useCountries = () => useLocationStore((state) => state.countries);
export const useCountriesLoading = () => useLocationStore((state) => state.countriesLoading);
export const useRegions = () => useLocationStore((state) => state.regions);
export const useRegionsLoading = () => useLocationStore((state) => state.regionsLoading);

export const useFetchCountries = () => useLocationStore((state) => state.fetchCountries);
export const useSetCountries = () => useLocationStore((state) => state.setCountries);
export const useFetchRegions = () => useLocationStore((state) => state.fetchRegions);
export const useGetCountryByCode = () => useLocationStore((state) => state.getCountryByCode);
export const useGetRegion = () => useLocationStore((state) => state.getRegion);
