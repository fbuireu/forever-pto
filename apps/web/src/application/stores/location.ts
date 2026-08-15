import type { CountryDTO } from '@application/dto/country/types';
import type { RegionDTO } from '@application/dto/region/types';
import { logClient } from '@application/shared/utils/clientLog';
import { getRegions } from '@infrastructure/services/regions/getRegions';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { obfuscatedStorage } from './crypto';

interface LocationState {
  countries: CountryDTO[];
  regions: RegionDTO[];
}

interface LocationActions {
  setCountries: (countries: CountryDTO[]) => void;
  fetchRegions: (countryCode: string) => void;
}

type LocationStore = LocationState & LocationActions;

type PersistedLocationState = Partial<LocationState>;

const STORAGE_NAME = 'location-store';
const STORAGE_VERSION = 3;

const locationInitialState: LocationState = {
  countries: [],
  regions: [],
};

export const useLocationStore = create<LocationStore>()(
  devtools(
    persist(
      (set) => ({
        ...locationInitialState,

        setCountries: (countries: CountryDTO[]) => {
          set({ countries });
        },

        fetchRegions: (countryCode: string) => {
          set({ regions: getRegions(countryCode) });
        },
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: obfuscatedStorage,
        partialize: (): PersistedLocationState => ({}),
        migrate: (): PersistedLocationState => ({}),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            logClient((logger) =>
              logger.logError('Error rehydrating location store', error, {
                storeName: STORAGE_NAME,
                hasState: !!state,
              })
            );
            globalThis.localStorage?.removeItem(STORAGE_NAME);
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
