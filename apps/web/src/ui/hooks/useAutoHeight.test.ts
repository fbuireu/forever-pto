import { act, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
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

  vi.stubGlobal(
    'getComputedStyle',
    vi.fn(() => ({
      paddingTop: '0px',
      paddingBottom: '0px',
      borderTopWidth: '0px',
      borderBottomWidth: '0px',
      boxSizing: 'content-box',
    }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const attachRef = (result: { ref: RefObject<HTMLElement | null> }, rectHeight = 0) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  el.getBoundingClientRect = () => ({ height: rectHeight }) as DOMRect;
  result.ref.current = el;
  return el;
};

const stubBox = (boxSizing: string) => {
  vi.stubGlobal(
    'getComputedStyle',
    vi.fn(() => ({
      paddingTop: '10px',
      paddingBottom: '10px',
      borderTopWidth: '2px',
      borderBottomWidth: '2px',
      boxSizing,
    }))
  );
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

    act(() => {
      deps = [2];
      rerender();
    });
    const firstCount = observe.mock.calls.length;

    act(() => {
      deps = [3];
      rerender();
    });

    expect(observe.mock.calls.length).toBeGreaterThan(firstCount);
    el.remove();
  });

  it('reports the element rect height plus the parent border-box padding and border', () => {
    stubBox('border-box');
    let deps = [1];
    const { result, rerender } = renderHook(() => useAutoHeight(deps));

    const el = attachRef(result.current, 50);

    act(() => {
      deps = [2];
      rerender();
    });

    expect(result.current.height).toBe(74);
    el.remove();
  });

  it('adds nothing for a content-box parent', () => {
    stubBox('content-box');
    let deps = [1];
    const { result, rerender } = renderHook(() => useAutoHeight(deps));

    const el = attachRef(result.current, 50);

    act(() => {
      deps = [2];
      rerender();
    });

    expect(result.current.height).toBe(50);
    el.remove();
  });

  it('rounds the total up to a whole device pixel', () => {
    stubBox('content-box');
    vi.stubGlobal('devicePixelRatio', 3);
    let deps = [1];
    const { result, rerender } = renderHook(() => useAutoHeight(deps));

    const el = attachRef(result.current, 50.1);

    act(() => {
      deps = [2];
      rerender();
    });

    expect(result.current.height).toBeCloseTo(151 / 3, 5);
    el.remove();
  });

  it('retries the measurement at mount when the element measures zero, and only then', () => {
    stubBox('border-box');
    const { result, rerender } = renderHook(() => useAutoHeight([1]));

    const el = attachRef(result.current, 50);
    expect(result.current.height).toBe(0);

    act(() => {
      rerender();
    });

    expect(result.current.height).toBe(0);
    el.remove();
  });
});
