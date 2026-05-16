import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePremiumStore } from './premium';

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: vi.fn(), warn: vi.fn() }),
}));

vi.mock('@infrastructure/clients/logging/better-stack/tracking', () => ({
  track: vi.fn(),
}));

vi.mock('@infrastructure/services/session/checkSession', () => ({
  verifyPremiumEmail: vi.fn(),
  getExistingSession: vi.fn(),
}));

vi.mock('./crypto', () => ({
  encryptedStorage: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

const INITIAL = {
  premiumKey: null,
  userEmail: null,
  lastVerified: null,
  isLoading: false,
  modalOpen: false,
  currentFeature: '',
  needsSessionCheck: false,
};

beforeEach(() => {
  usePremiumStore.setState(INITIAL);
  vi.clearAllMocks();
});

describe('setPremiumStatus', () => {
  it('sets premiumKey, userEmail, lastVerified, and clears needsSessionCheck', () => {
    const before = Date.now();
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: 'key123' });
    const state = usePremiumStore.getState();
    expect(state.premiumKey).toBe('key123');
    expect(state.userEmail).toBe('user@example.com');
    expect(state.lastVerified).toBeGreaterThanOrEqual(before);
    expect(state.needsSessionCheck).toBe(false);
  });

  it('tracks premium_activated', async () => {
    const { track } = await import('@infrastructure/clients/logging/better-stack/tracking');
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: 'key123' });
    expect(track).toHaveBeenCalledWith('premium_activated', { plan: 'premium' });
  });
});

describe('showUpgradeModal / closeModal', () => {
  it('showUpgradeModal opens modal with feature', async () => {
    const { track } = await import('@infrastructure/clients/logging/better-stack/tracking');
    usePremiumStore.getState().showUpgradeModal('export');
    const state = usePremiumStore.getState();
    expect(state.modalOpen).toBe(true);
    expect(state.currentFeature).toBe('export');
    expect(track).toHaveBeenCalledWith('upgrade_modal_opened', { feature: 'export' });
  });

  it('closeModal closes modal and clears feature', () => {
    usePremiumStore.setState({ modalOpen: true, currentFeature: 'export' });
    usePremiumStore.getState().closeModal();
    expect(usePremiumStore.getState().modalOpen).toBe(false);
    expect(usePremiumStore.getState().currentFeature).toBe('');
  });
});

describe('setEmail', () => {
  it('updates userEmail', () => {
    usePremiumStore.getState().setEmail('new@example.com');
    expect(usePremiumStore.getState().userEmail).toBe('new@example.com');
  });
});

describe('resetPremiumStore', () => {
  it('resets all state to initial values', () => {
    usePremiumStore.setState({ premiumKey: 'key', userEmail: 'user@example.com', modalOpen: true, currentFeature: 'export' });
    usePremiumStore.getState().resetPremiumStore();
    const state = usePremiumStore.getState();
    expect(state.premiumKey).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.modalOpen).toBe(false);
    expect(state.currentFeature).toBe('');
  });
});

describe('verifyEmail', () => {
  it('returns true and sets premium status on success', async () => {
    const { verifyPremiumEmail } = await import('@infrastructure/services/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockResolvedValueOnce({ premiumKey: 'pk_123' });

    const result = await usePremiumStore.getState().verifyEmail('user@example.com');
    expect(result).toBe(true);
    expect(usePremiumStore.getState().premiumKey).toBe('pk_123');
    expect(usePremiumStore.getState().userEmail).toBe('user@example.com');
    expect(usePremiumStore.getState().isLoading).toBe(false);
  });

  it('returns false when no premium key returned', async () => {
    const { verifyPremiumEmail } = await import('@infrastructure/services/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockResolvedValueOnce(null);

    const result = await usePremiumStore.getState().verifyEmail('user@example.com');
    expect(result).toBe(false);
    expect(usePremiumStore.getState().premiumKey).toBeNull();
    expect(usePremiumStore.getState().isLoading).toBe(false);
  });

  it('returns false and sets isLoading to false on error', async () => {
    const { verifyPremiumEmail } = await import('@infrastructure/services/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockRejectedValueOnce(new Error('network failure'));

    const result = await usePremiumStore.getState().verifyEmail('user@example.com');
    expect(result).toBe(false);
    expect(usePremiumStore.getState().isLoading).toBe(false);
  });
});

describe('checkExistingSession', () => {
  it('does nothing when needsSessionCheck is false', async () => {
    const { getExistingSession } = await import('@infrastructure/services/session/checkSession');
    usePremiumStore.setState({ needsSessionCheck: false });

    await usePremiumStore.getState().checkExistingSession();
    expect(getExistingSession).not.toHaveBeenCalled();
  });

  it('sets premium state from session when needsSessionCheck is true', async () => {
    const { getExistingSession } = await import('@infrastructure/services/session/checkSession');
    vi.mocked(getExistingSession).mockResolvedValueOnce({ premiumKey: 'pk_session', email: 'session@example.com' });
    usePremiumStore.setState({ needsSessionCheck: true });

    await usePremiumStore.getState().checkExistingSession();
    const state = usePremiumStore.getState();
    expect(state.premiumKey).toBe('pk_session');
    expect(state.userEmail).toBe('session@example.com');
    expect(state.needsSessionCheck).toBe(false);
  });

  it('clears premium state when session returns null', async () => {
    const { getExistingSession } = await import('@infrastructure/services/session/checkSession');
    vi.mocked(getExistingSession).mockResolvedValueOnce(null);
    usePremiumStore.setState({ needsSessionCheck: true, premiumKey: 'old_key', userEmail: 'old@example.com' });

    await usePremiumStore.getState().checkExistingSession();
    const state = usePremiumStore.getState();
    expect(state.premiumKey).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.needsSessionCheck).toBe(false);
  });

  it('clears needsSessionCheck on error', async () => {
    const { getExistingSession } = await import('@infrastructure/services/session/checkSession');
    vi.mocked(getExistingSession).mockRejectedValueOnce(new Error('server error'));
    usePremiumStore.setState({ needsSessionCheck: true });

    await usePremiumStore.getState().checkExistingSession();
    expect(usePremiumStore.getState().needsSessionCheck).toBe(false);
  });
});

describe('refreshPremiumStatus', () => {
  it('calls verifyEmail with the stored email', async () => {
    const { verifyPremiumEmail } = await import('@infrastructure/services/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockResolvedValueOnce({ premiumKey: 'refreshed' });
    usePremiumStore.setState({ userEmail: 'refresh@example.com' });

    await usePremiumStore.getState().refreshPremiumStatus();
    expect(verifyPremiumEmail).toHaveBeenCalledWith('refresh@example.com');
  });

  it('does nothing when userEmail is null', async () => {
    const { verifyPremiumEmail } = await import('@infrastructure/services/session/checkSession');
    usePremiumStore.setState({ userEmail: null });

    await usePremiumStore.getState().refreshPremiumStatus();
    expect(verifyPremiumEmail).not.toHaveBeenCalled();
  });
});
