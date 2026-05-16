import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './useMobile';

const makeMediaQueryList = (matches: boolean) => ({
  matches,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => makeMediaQueryList(query.includes('767px') || query.includes('max-width: 767px'))));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useIsMobile', () => {
  it('returns false when viewport is wider than breakpoint', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => makeMediaQueryList(false)));
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when viewport is narrower than breakpoint', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => makeMediaQueryList(true)));
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('subscribes to media query change events', () => {
    const mql = makeMediaQueryList(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));

    renderHook(() => useIsMobile());

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const mql = makeMediaQueryList(false);
    vi.stubGlobal('matchMedia', vi.fn(() => mql));

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
