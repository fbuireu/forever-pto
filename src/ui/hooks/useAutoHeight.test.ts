import type { RefObject } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoHeight } from './useAutoHeight';

const disconnect = vi.fn();
const observe = vi.fn();

function MockResizeObserver(this: object, cb: () => void) {
  Object.assign(this, { observe, disconnect, _cb: cb });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('ResizeObserver', MockResizeObserver);

  vi.stubGlobal('getComputedStyle', vi.fn(() => ({
    paddingTop: '0px',
    paddingBottom: '0px',
    borderTopWidth: '0px',
    borderBottomWidth: '0px',
    boxSizing: 'content-box',
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const attachRef = (result: { ref: RefObject<HTMLElement | null> }) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  result.ref.current = el;
  return el;
};

describe('useAutoHeight', () => {
  it('returns a ref and an initial height of 0', () => {
    const { result } = renderHook(() => useAutoHeight());
    expect(result.current.ref).toBeDefined();
    expect(result.current.height).toBe(0);
  });

  it('creates a ResizeObserver once a DOM element is attached', () => {
    let deps = [1];
    const { result, rerender } = renderHook(() => useAutoHeight(deps));

    const el = attachRef(result.current);

    act(() => {
      deps = [2];
      rerender();
    });

    expect(observe).toHaveBeenCalledWith(el);
    el.remove();
  });

  it('disconnects the ResizeObserver on unmount', () => {
    let deps = [1];
    const { result, rerender, unmount } = renderHook(() => useAutoHeight(deps));

    const el = attachRef(result.current);

    act(() => {
      deps = [2];
      rerender();
    });

    unmount();
    expect(disconnect).toHaveBeenCalled();
    el.remove();
  });

  it('re-creates the observer when deps change', () => {
    let deps = [1];
    const { result, rerender } = renderHook(() => useAutoHeight(deps));

    const el = attachRef(result.current);

    act(() => { deps = [2]; rerender(); });
    const firstCount = observe.mock.calls.length;

    act(() => { deps = [3]; rerender(); });

    expect(observe.mock.calls.length).toBeGreaterThan(firstCount);
    el.remove();
  });
});
