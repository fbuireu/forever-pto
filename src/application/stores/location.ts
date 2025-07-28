import { CountryDTO } from '@application/dto/country/types';
import { RegionDTO } from '@application/dto/region/types';
import { getCountries } from '@infrastructure/services/countries/getCountries';
import { getRegions } from '@infrastructure/services/regions/getRegions';
import { Locale } from 'next-intl';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface LocationState {
  countries: CountryDTO[];
  countriesLoading: boolean;
  countriesLastFetched: number;
  regions: RegionDTO[];
  regionsLoading: boolean;
  currentCountryCode: string;
}

interface LocationActions {
  fetchCountries: (locale: Locale) => Promise<void>;
  getCountryByCode: (code: string) => CountryDTO | undefined;
  fetchRegions: (countryCode: string) => Promise<void>;
  getRegionsByCountry: (countryCode: string) => RegionDTO[];
  getRegion: (countryCode: string, regionCode: string) => RegionDTO | undefined;
}

type LocationStore = LocationState & LocationActions;

const initialState: LocationState = {
  countries: [],
  countriesLoading: false,
  countriesLastFetched: 0,
  regions: [],
  regionsLoading: false,
  currentCountryCode: '',
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

        getCountryByCode: (code: string) => {
          const { countries } = get();

          return countries.find((country) => country.value.toLowerCase() === code.toLowerCase());
        },

        fetchRegions: async (countryCode: string) => {
          const { currentCountryCode } = get();

          if (currentCountryCode === countryCode) {
            return;
          }

          set({ regionsLoading: true });

          try {
            const regionData = getRegions(countryCode);
            set({
              regions: regionData,
              currentCountryCode: countryCode,
              regionsLoading: false,
            });
          } catch (error) {
            set({
              regionsLoading: false,
            });
          }
        },

        getRegionsByCountry: (countryCode: string) => {
          const { regions, currentCountryCode } = get();
          return currentCountryCode === countryCode ? regions : [];
        },

        getRegion: (countryCode: string, regionCode: string) => {
          const { regions, currentCountryCode } = get();
          if (currentCountryCode !== countryCode) return undefined;
          return regions.find((region) => region.value.toLowerCase() === regionCode.toLowerCase());
        },
      }),
      {
        name: 'location-store',
        partialize: (state) => ({
          countries: state.countries,
          countriesLastFetched: state.countriesLastFetched,
          regions: state.regions,
          currentCountryCode: state.currentCountryCode,
        }),
      }
    ),
    { name: 'location-store' }
  )
);

export const useCountries = () => useLocationStore((state) => state.countries);
export const useCountriesLoading = () => useLocationStore((state) => state.countriesLoading);

export const useRegions = () => useLocationStore((state) => state.regions);
export const useCurrentCountryCode = () => useLocationStore((state) => state.currentCountryCode);
export const useRegionsLoading = () => useLocationStore((state) => state.regionsLoading);

export const useFetchCountries = () => useLocationStore((state) => state.fetchCountries);
export const useFetchRegions = () => useLocationStore((state) => state.fetchRegions);
export const useGetCountryByCode = () => useLocationStore((state) => state.getCountryByCode);
export const useGetRegion = () => useLocationStore((state) => state.getRegion);
