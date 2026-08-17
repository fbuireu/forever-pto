import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePremiumStore } from './premium';

const { mockLogError, mockWarn } = vi.hoisted(() => ({ mockLogError: vi.fn(), mockWarn: vi.fn() }));

vi.mock('@infrastructure/clients/logging/better-stack/client', () => ({
  getBetterStackInstance: vi.fn().mockReturnValue({ logError: mockLogError, warn: mockWarn }),
}));

vi.mock('@infrastructure/clients/logging/better-stack/tracking', () => ({
  track: vi.fn(),
}));

vi.mock('@ui/adapters/session/checkSession', () => ({
  verifyPremiumEmail: vi.fn(),
  getExistingSession: vi.fn(),
}));

vi.mock('./crypto', () => ({
  obfuscatedStorage: {
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

  it('tracks premium_activated on the transition into premium', async () => {
    const { track } = await import('@infrastructure/clients/logging/better-stack/tracking');
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: 'key123' });
    expect(track).toHaveBeenCalledWith('premium_activated', { plan: 'premium' });
  });

  it('does not track premium_activated when the same entitlement is re-verified', async () => {
    const { track } = await import('@infrastructure/clients/logging/better-stack/tracking');
    usePremiumStore.setState({ premiumKey: 'key123' });
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: 'key123' });
    expect(track).not.toHaveBeenCalled();
  });

  it('does not track premium_activated when verification returns no key', async () => {
    const { track } = await import('@infrastructure/clients/logging/better-stack/tracking');
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: null });
    expect(track).not.toHaveBeenCalled();
  });

  it('tracks once per activation across a re-verification cycle', async () => {
    const { track } = await import('@infrastructure/clients/logging/better-stack/tracking');
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: 'key123' });
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: 'key123' });
    usePremiumStore.getState().setPremiumStatus({ email: 'user@example.com', premiumKey: 'key123' });
    expect(track).toHaveBeenCalledTimes(1);
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
    usePremiumStore.setState({
      premiumKey: 'key',
      userEmail: 'user@example.com',
      modalOpen: true,
      currentFeature: 'export',
    });
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
    const { verifyPremiumEmail } = await import('@ui/adapters/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockResolvedValueOnce({ premiumKey: 'pk_123' });

    const result = await usePremiumStore.getState().verifyEmail('user@example.com');
    expect(result).toBe(true);
    expect(usePremiumStore.getState().premiumKey).toBe('pk_123');
    expect(usePremiumStore.getState().userEmail).toBe('user@example.com');
    expect(usePremiumStore.getState().isLoading).toBe(false);
  });

  it('returns false when no premium key returned', async () => {
    const { verifyPremiumEmail } = await import('@ui/adapters/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockResolvedValueOnce(null);

    const result = await usePremiumStore.getState().verifyEmail('user@example.com');
    expect(result).toBe(false);
    expect(usePremiumStore.getState().premiumKey).toBeNull();
    expect(usePremiumStore.getState().isLoading).toBe(false);
  });

  it('returns false and sets isLoading to false on error', async () => {
    const { verifyPremiumEmail } = await import('@ui/adapters/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockRejectedValueOnce(new Error('network failure'));

    const result = await usePremiumStore.getState().verifyEmail('user@example.com');
    expect(result).toBe(false);
    expect(usePremiumStore.getState().isLoading).toBe(false);
  });

  it('logs the failure with the email domain only, and never the address', async () => {
    const { verifyPremiumEmail } = await import('@ui/adapters/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockRejectedValueOnce(new Error('network failure'));

    await usePremiumStore.getState().verifyEmail('user@example.com');

    await vi.waitFor(() =>
      expect(mockLogError).toHaveBeenCalledWith('Error verifying premium email in premium store', expect.any(Error), {
        emailDomain: 'example.com',
        hasEmail: true,
      })
    );
  });
});

describe('checkExistingSession', () => {
  it('answers one request for concurrent callers, because every PremiumFeature mount asks', async () => {
    const { getExistingSession } = await import('@ui/adapters/session/checkSession');
    vi.mocked(getExistingSession).mockClear();
    let settle: (value: { premiumKey: string; email: string }) => void = () => {};
    vi.mocked(getExistingSession).mockReturnValueOnce(
      new Promise((resolve) => {
        settle = resolve;
      })
    );
    usePremiumStore.setState({ needsSessionCheck: true, premiumKey: null });

    const inFlight = [
      usePremiumStore.getState().checkExistingSession(),
      usePremiumStore.getState().checkExistingSession(),
      usePremiumStore.getState().checkExistingSession(),
    ];

    settle({ premiumKey: 'pk_one', email: 'donor@example.com' });
    await Promise.all(inFlight);

    expect(getExistingSession).toHaveBeenCalledTimes(1);
    expect(usePremiumStore.getState().premiumKey).toBe('pk_one');
  });

  it('does nothing when needsSessionCheck is false', async () => {
    const { getExistingSession } = await import('@ui/adapters/session/checkSession');
    usePremiumStore.setState({ needsSessionCheck: false });

    await usePremiumStore.getState().checkExistingSession();
    expect(getExistingSession).not.toHaveBeenCalled();
  });

  it('checks anyway when forced, which is how a redirect payer picks up the cookie the route just set', async () => {
    const { getExistingSession } = await import('@ui/adapters/session/checkSession');
    vi.mocked(getExistingSession).mockResolvedValueOnce({ premiumKey: 'pk_redirect', email: 'donor@example.com' });
    usePremiumStore.setState({ needsSessionCheck: false, premiumKey: null, userEmail: null });

    await usePremiumStore.getState().checkExistingSession({ force: true });

    expect(getExistingSession).toHaveBeenCalled();
    expect(usePremiumStore.getState().premiumKey).toBe('pk_redirect');
  });

  it('sets premium state from session when needsSessionCheck is true', async () => {
    const { getExistingSession } = await import('@ui/adapters/session/checkSession');
    vi.mocked(getExistingSession).mockResolvedValueOnce({ premiumKey: 'pk_session', email: 'session@example.com' });
    usePremiumStore.setState({ needsSessionCheck: true });

    await usePremiumStore.getState().checkExistingSession();
    const state = usePremiumStore.getState();
    expect(state.premiumKey).toBe('pk_session');
    expect(state.userEmail).toBe('session@example.com');
    expect(state.needsSessionCheck).toBe(false);
  });

  it('clears premium state when session returns null', async () => {
    const { getExistingSession } = await import('@ui/adapters/session/checkSession');
    vi.mocked(getExistingSession).mockResolvedValueOnce(null);
    usePremiumStore.setState({ needsSessionCheck: true, premiumKey: 'old_key', userEmail: 'old@example.com' });

    await usePremiumStore.getState().checkExistingSession();
    const state = usePremiumStore.getState();
    expect(state.premiumKey).toBeNull();
    expect(state.userEmail).toBeNull();
    expect(state.needsSessionCheck).toBe(false);
  });

  it('clears needsSessionCheck on error', async () => {
    const { getExistingSession } = await import('@ui/adapters/session/checkSession');
    vi.mocked(getExistingSession).mockRejectedValueOnce(new Error('server error'));
    usePremiumStore.setState({ needsSessionCheck: true });

    await usePremiumStore.getState().checkExistingSession();
    expect(usePremiumStore.getState().needsSessionCheck).toBe(false);
  });

  it('keeps a donor premium when the check fails, since a server blip is not a revocation', async () => {
    const { getExistingSession } = await import('@ui/adapters/session/checkSession');
    vi.mocked(getExistingSession).mockRejectedValueOnce(new Error('check-session answered 500'));
    usePremiumStore.setState({ needsSessionCheck: true, premiumKey: 'pk_paid', userEmail: 'donor@example.com' });

    await usePremiumStore.getState().checkExistingSession();
    const state = usePremiumStore.getState();
    expect(state.premiumKey).toBe('pk_paid');
    expect(state.userEmail).toBe('donor@example.com');
  });
});

describe('refreshPremiumStatus', () => {
  it('calls verifyEmail with the stored email', async () => {
    const { verifyPremiumEmail } = await import('@ui/adapters/session/checkSession');
    vi.mocked(verifyPremiumEmail).mockResolvedValueOnce({ premiumKey: 'refreshed' });
    usePremiumStore.setState({ userEmail: 'refresh@example.com' });

    await usePremiumStore.getState().refreshPremiumStatus();
    expect(verifyPremiumEmail).toHaveBeenCalledWith('refresh@example.com');
  });

  it('does nothing when userEmail is null', async () => {
    const { verifyPremiumEmail } = await import('@ui/adapters/session/checkSession');
    usePremiumStore.setState({ userEmail: null });

    await usePremiumStore.getState().refreshPremiumStatus();
    expect(verifyPremiumEmail).not.toHaveBeenCalled();
  });
});

describe('onRehydrateStorage', () => {
  const runRehydrate = (
    state: { lastVerified: number | null; needsSessionCheck: boolean } | undefined,
    error?: Error
  ) => {
    const options = usePremiumStore.persist.getOptions();
    const listener = options.onRehydrateStorage?.(usePremiumStore.getState() as never);
    listener?.(state as never, error);
    return state;
  };

  it('flags a session check when the device has never verified', () => {
    const state = runRehydrate({ lastVerified: null, needsSessionCheck: false });
    expect(state?.needsSessionCheck).toBe(true);
  });

  it('flags a session check when the last verification is older than 24h', () => {
    const state = runRehydrate({ lastVerified: Date.now() - 25 * 60 * 60 * 1000, needsSessionCheck: false });
    expect(state?.needsSessionCheck).toBe(true);
  });

  it('does not flag a session check when verification is recent', () => {
    const state = runRehydrate({ lastVerified: Date.now() - 60 * 1000, needsSessionCheck: false });
    expect(state?.needsSessionCheck).toBe(false);
  });

  it('flags a session check when rehydration failed, so the cookie can restore access', () => {
    const state = runRehydrate({ lastVerified: Date.now(), needsSessionCheck: false }, new Error('deobfuscate failed'));
    expect(state?.needsSessionCheck).toBe(true);
  });

  it('does not throw when there is no state to rehydrate', () => {
    expect(() => runRehydrate(undefined)).not.toThrow();
  });

  it('warns when there is no state, without blocking the listener on the logging client', async () => {
    runRehydrate(undefined);

    expect(mockWarn).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(mockWarn).toHaveBeenCalledWith('No state to rehydrate in premium store', {
        storeName: 'premium-store',
      })
    );
  });

  it('logs a rehydration failure', async () => {
    runRehydrate({ lastVerified: Date.now(), needsSessionCheck: false }, new Error('deobfuscate failed'));

    expect(mockLogError).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(mockLogError).toHaveBeenCalledWith('Error rehydrating premium-store', expect.any(Error), {
        storeName: 'premium-store',
        hasState: true,
      })
    );
  });
});
