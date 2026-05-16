import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { track } from '@infrastructure/clients/logging/better-stack/tracking';
import { getExistingSession, verifyPremiumEmail } from '@infrastructure/services/session/checkSession';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { encryptedStorage } from './crypto';
import { TWENTY_FOUR_HOURS } from './utils';

const logger = getBetterStackInstance();

interface PremiumState {
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
  setEmail: (email: string) => void;
  resetPremiumStore: () => void;
}

type PremiumStore = PremiumState & PremiumActions;

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
            const result = await verifyPremiumEmail(email);
            if (result) {
              get().setPremiumStatus({ email, premiumKey: result.premiumKey });
              set({ isLoading: false });
              return true;
            }
            set({ isLoading: false });
            return false;
          } catch (error) {
            logger.logError('Error verifying premium email in premium store', error, {
              emailDomain: email?.split('@')[1],
              hasEmail: !!email,
            });
            set({ isLoading: false });
            return false;
          }
        },

        checkExistingSession: async () => {
          const { needsSessionCheck } = get();
          if (!needsSessionCheck) return;

          try {
            const session = await getExistingSession();
            set({
              premiumKey: session?.premiumKey ?? null,
              userEmail: session?.email ?? null,
              lastVerified: Date.now(),
              needsSessionCheck: false,
            });
          } catch (error) {
            logger.logError('Error checking existing session in premium store', error, { needsSessionCheck });
            set({ lastVerified: Date.now(), needsSessionCheck: false });
          }
        },

        setEmail: (email: string) => {
          set({ userEmail: email });
        },

        setPremiumStatus: ({ email, premiumKey }: SetPremiumStatusParams) => {
          set({
            premiumKey,
            userEmail: email,
            lastVerified: Date.now(),
            needsSessionCheck: false,
          });
          track('premium_activated', { plan: 'premium' });
        },

        resetPremiumStore: () => {
          set({ ...premiumInitialState });
        },

        refreshPremiumStatus: async () => {
          const { userEmail } = get();
          if (userEmail) {
            await get().verifyEmail(userEmail);
          }
        },

        showUpgradeModal: (feature: string) => {
          set({ currentFeature: feature, modalOpen: true });
          track('upgrade_modal_opened', { feature });
        },

        closeModal: () => {
          set({ modalOpen: false, currentFeature: '' });
        },
      }),
      {
        name: STORAGE_NAME,
        version: STORAGE_VERSION,
        storage: encryptedStorage,
        partialize: (state) => ({
          premiumKey: state.premiumKey,
          userEmail: state.userEmail,
          lastVerified: state.lastVerified,
          needsSessionCheck: state.needsSessionCheck,
        }),
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            logger.logError('Error rehydrating premium store', error, {
              storeName: STORAGE_NAME,
              hasState: !!state,
            });
            localStorage.removeItem(STORAGE_NAME);
            return;
          }

          if (!state) {
            logger.warn('No state to rehydrate in premium store', {
              storeName: STORAGE_NAME,
            });
            return;
          }

          if (state.lastVerified && Date.now() - state.lastVerified > TWENTY_FOUR_HOURS) {
            state.needsSessionCheck = true;
          }
        },
      }
    ),
    { name: STORAGE_NAME }
  )
);
