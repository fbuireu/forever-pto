import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useControlledState } from './useControlledState';

describe('useControlledState', () => {
  describe('uncontrolled mode (no value prop)', () => {
    it('initialises from defaultValue', () => {
      const { result } = renderHook(() => useControlledState({ defaultValue: 'initial' }));
      expect(result.current[0]).toBe('initial');
    });

    it('updates internal state when setState is called', () => {
      const { result } = renderHook(() => useControlledState({ defaultValue: 'a' }));

      act(() => {
        result.current[1]('b');
      });

      expect(result.current[0]).toBe('b');
    });

    it('calls onChange when setState is called', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControlledState({ defaultValue: 0, onChange }));

      act(() => {
        result.current[1](42);
      });

      expect(onChange).toHaveBeenCalledWith(42);
    });
  });

  describe('controlled mode (value prop provided)', () => {
    it('uses the value prop as the current state', () => {
      const { result } = renderHook(() => useControlledState({ value: 'controlled' }));
      expect(result.current[0]).toBe('controlled');
    });

    it('syncs internal state when value prop changes', () => {
      let value = 'first';
      const { result, rerender } = renderHook(() => useControlledState({ value }));

      value = 'second';
      rerender();

      expect(result.current[0]).toBe('second');
    });

    it('still calls onChange when setState is called in controlled mode', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControlledState({ value: 'v', onChange }));

      act(() => {
        result.current[1]('new');
      });

      expect(onChange).toHaveBeenCalledWith('new');
    });
  });

  it('forwards extra args to onChange', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControlledState<string, [boolean]>({ defaultValue: '', onChange })
    );

    act(() => {
      result.current[1]('x', true);
    });

    expect(onChange).toHaveBeenCalledWith('x', true);
  });

  it('picks up a new onChange reference without stale closure', () => {
    const first = vi.fn();
    const second = vi.fn();
    let onChange = first;

    const { result, rerender } = renderHook(() => useControlledState({ defaultValue: '', onChange }));

    onChange = second;
    rerender();

    act(() => {
      result.current[1]('updated');
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('updated');
  });
});
