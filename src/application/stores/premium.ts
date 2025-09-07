import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';

interface PremiumState {
  isPremium: boolean;
  userEmail: string | null;
  lastVerified: number | null;
  isLoading: boolean;
  modalOpen: boolean;
  currentFeature: string;
}

interface PremiumActions {
  verifyEmail: (email: string) => Promise<boolean>;
  checkExistingSession: () => Promise<void>;
  showUpgradeModal: (feature: string) => void;
  closeModal: () => void;
}

type PremiumStore = PremiumState & PremiumActions;

const initialState: PremiumState = {
  isPremium: false,
  userEmail: null,
  lastVerified: null,
  isLoading: false,
  modalOpen: false,
  currentFeature: '',
};

const STORE_NAME = 'premium-store';

export const usePremiumStore = create<PremiumStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        verifyEmail: async (email: string) => {
          set({ isLoading: true });

          try {
            const response = await fetch('/api/verify-premium', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
              credentials: 'include',
            });

            if (response.ok) {
              const { isPremium } = await response.json();

              if (isPremium) {
                set({
                  isPremium: true,
                  userEmail: email,
                  lastVerified: Date.now(),
                  modalOpen: false,
                  isLoading: false,
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
          try {
            const response = await fetch('/api/check-session', {
              credentials: 'include',
            });

            if (response.ok) {
              const { isPremium, email } = await response.json();

              if (isPremium) {
                set({
                  isPremium: true,
                  userEmail: email,
                  lastVerified: Date.now(),
                });
              }
            }
          } catch (error) {
            console.error('Error checking session:', error);
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
        }
      }),
      {
        name: STORE_NAME,
        storage: encryptedStorage,
        partialize: (state) => ({
          isPremium: state.isPremium,
          userEmail: state.userEmail,
          lastVerified: state.lastVerified,
        }),
        onRehydrateStorage: () => (state) => {
          const twentyFourHours = 24 * 60 * 60 * 1000;
          const isExpired = state?.lastVerified && Date.now() - state.lastVerified > twentyFourHours;

          if (isExpired) {
            state.checkExistingSession?.();
          }
        },
      }
    ),
    { name: STORE_NAME }
  )
);

export const usePremiumState = () => usePremiumStore((state) => state);
