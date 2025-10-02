import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { createEncryptedStorage } from './crypto';

export interface PremiumState {
  premiumKey: string | null;
  userEmail: string | null;
  lastVerified: number | null;
  isLoading: boolean;
  modalOpen: boolean;
  currentFeature: string;
  needsSessionCheck: boolean;
}

interface SetPremiumStatusParams {
  email: string;
  premiumKey: string | null;
}

interface PremiumActions {
  verifyEmail: (email: string) => Promise<boolean>;
  checkExistingSession: () => Promise<void>;
  showUpgradeModal: (feature: string) => void;
  closeModal: () => void;
  setPremiumStatus: ({ email, premiumKey }: SetPremiumStatusParams) => void;
  refreshPremiumStatus: () => Promise<void>;
}

type PremiumStore = PremiumState & PremiumActions;

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const STORAGE_NAME = 'premium-store';
const STORAGE_VERSION = 1;

const premiumInitialState: PremiumState = {
  premiumKey: null,
  userEmail: null,
  lastVerified: null,
  isLoading: false,
  modalOpen: false,
  currentFeature: '',
  needsSessionCheck: false,
};

export const usePremiumStore = create<PremiumStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...premiumInitialState,

        verifyEmail: async (email: string) => {
          set({ isLoading: true });

          try {
            const response = await fetch('/api/check-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
              credentials: 'include',
            });

            if (response.ok) {
              const { premiumKey } = await response.json();

              if (premiumKey) {
                set({
                  premiumKey,
                  userEmail: email,
                  lastVerified: Date.now(),
                  modalOpen: false,
                  isLoading: false,
                  needsSessionCheck: false,
                });
                return true;
              }
            }

            set({ isLoading: false });
            return false;
          } catch (error) {
            console.error('Error verifying premium:', error);
            set({ isLoading: false });
            return false;
          }
        },

        checkExistingSession: async () => {
          const { needsSessionCheck } = get();

          if (!needsSessionCheck) return;

          try {
            const response = await fetch('/api/check-session', {
              credentials: 'include',
            });

            if (response.ok) {
              const { premiumKey, email } = await response.json();

              set({
                premiumKey,
                userEmail: email ?? null,
                lastVerified: Date.now(),
                needsSessionCheck: false,
              });
            } else {
              set({
                lastVerified: Date.now(),
                needsSessionCheck: false,
              });
            }
          } catch (error) {
            console.error('Error checking session:', error);
            set({
              lastVerified: Date.now(),
              needsSessionCheck: false,
            });
          }
        },

        setPremiumStatus: ({ email, premiumKey }: SetPremiumStatusParams) => {
          set({
            premiumKey,
            userEmail: email,
            lastVerified: Date.now(),
            needsSessionCheck: false,
          });
        },

        refreshPremiumStatus: async () => {
          const { userEmail } = get();
          if (userEmail) {
            await get().verifyEmail(userEmail);
          }
        },

        showUpgradeModal: (feature: string) => {
          set({
            currentFeature: feature,
            modalOpen: true,
          });
        },

        closeModal: () => {
          set({
            modalOpen: false,
            currentFeature: '',
          });
        },
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: createJSONStorage(
          () => createEncryptedStorage({ storeName: STORAGE_NAME, version: STORAGE_VERSION }).storage
        ),
        partialize: (state) => ({
          premiumKey: state.premiumKey,
          userEmail: state.userEmail,
          lastVerified: state.lastVerified,
          needsSessionCheck: state.needsSessionCheck,
        }),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Error rehydrating premium store:', error);
            return;
          }

          if (!state) {
            console.warn('No state to rehydrate');
            return;
          }

          if (state.lastVerified && Date.now() - state.lastVerified > TWENTY_FOUR_HOURS) {
            console.log('Session expired, marking for recheck');
            state.needsSessionCheck = true;
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
