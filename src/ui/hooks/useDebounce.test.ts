import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce({ value: 'hello', delay: 300 }));
    expect(result.current[0]).toBe('hello');
  });

  it('updates localValue synchronously when setValue is called', () => {
    const { result } = renderHook(() => useDebounce({ value: '', delay: 300 }));

    act(() => {
      result.current[1]('world');
    });

    expect(result.current[0]).toBe('world');
  });

  it('calls callback after the delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce({ value: '', delay: 300, callback }));

    act(() => {
      result.current[1]('typed');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('typed');
  });

  it('debounces rapid calls — only the last one triggers the callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce({ value: '', delay: 300, callback }));

    act(() => {
      result.current[1]('a');
      result.current[1]('ab');
      result.current[1]('abc');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('abc');
  });

  it('does not call callback when no delay has passed', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce({ value: '', delay: 500, callback }));

    act(() => {
      result.current[1]('partial');
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('syncs localValue when the outer value prop changes', () => {
    let value = 'first';
    const { result, rerender } = renderHook(() => useDebounce({ value, delay: 300 }));

    expect(result.current[0]).toBe('first');

    value = 'second';
    rerender();

    expect(result.current[0]).toBe('second');
  });

  it('clears the pending timer on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebounce({ value: '', delay: 300, callback }));

    act(() => {
      result.current[1]('pending');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
