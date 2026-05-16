import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { getStrictContext } from './context';

describe('getStrictContext', () => {
  it('returns a Provider and a hook', () => {
    const [Provider, useCtx] = getStrictContext<number>();
    expect(typeof Provider).toBe('function');
    expect(typeof useCtx).toBe('function');
  });

  it('provides the value to consumers', () => {
    const [Provider, useCtx] = getStrictContext<number>();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider value={42}>{children}</Provider>
    );
    const { result } = renderHook(() => useCtx(), { wrapper });
    expect(result.current).toBe(42);
  });

  it('throws with the context name when used outside a Provider', () => {
    const [, useCtx] = getStrictContext<number>('MyContext');
    expect(() => renderHook(() => useCtx())).toThrow('useContext must be used within MyContext');
  });

  it('throws a generic message when no name is provided', () => {
    const [, useCtx] = getStrictContext<number>();
    expect(() => renderHook(() => useCtx())).toThrow('useContext must be used within a Provider');
  });

  it('works with object values', () => {
    const [Provider, useCtx] = getStrictContext<{ count: number }>();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider value={{ count: 7 }}>{children}</Provider>
    );
    const { result } = renderHook(() => useCtx(), { wrapper });
    expect(result.current.count).toBe(7);
  });

  it('each call to getStrictContext creates an independent context', () => {
    const [ProviderA, useCtxA] = getStrictContext<string>();
    const [ProviderB, useCtxB] = getStrictContext<string>();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProviderA value='alpha'>
        <ProviderB value='beta'>{children}</ProviderB>
      </ProviderA>
    );
    const { result: a } = renderHook(() => useCtxA(), { wrapper });
    const { result: b } = renderHook(() => useCtxB(), { wrapper });
    expect(a.current).toBe('alpha');
    expect(b.current).toBe('beta');
  });
});
