import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockUseInView = vi.hoisted(() => vi.fn());

vi.mock('motion/react', () => ({
  useInView: mockUseInView,
}));

const { useIsInView } = await import('./useIsInView');

describe('useIsInView', () => {
  it('returns a ref and isInView', () => {
    mockUseInView.mockReturnValue(false);
    const { result } = renderHook(() => useIsInView({ current: null }));
    expect(result.current).toHaveProperty('ref');
    expect(result.current).toHaveProperty('isInView');
  });

  it('is true when inView prop is not passed, regardless of element visibility', () => {
    mockUseInView.mockReturnValue(false);
    const { result } = renderHook(() => useIsInView({ current: null }));
    // !undefined === true, so isInView is always true when inView is omitted
    expect(result.current.isInView).toBe(true);
  });

  it('is true when inView=true and element is in view', () => {
    mockUseInView.mockReturnValue(true);
    const { result } = renderHook(() => useIsInView({ current: null }, { inView: true }));
    expect(result.current.isInView).toBe(true);
  });

  it('is false when inView=true and element is not in view', () => {
    mockUseInView.mockReturnValue(false);
    const { result } = renderHook(() => useIsInView({ current: null }, { inView: true }));
    expect(result.current.isInView).toBe(false);
  });

  it('is always true when inView=false (feature disabled)', () => {
    mockUseInView.mockReturnValue(false);
    const { result } = renderHook(() => useIsInView({ current: null }, { inView: false }));
    expect(result.current.isInView).toBe(true);
  });

  it('passes inViewOnce to useInView', () => {
    mockUseInView.mockReturnValue(false);
    renderHook(() => useIsInView({ current: null }, { inViewOnce: true }));
    expect(mockUseInView).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ once: true }));
  });

  it('passes inViewMargin to useInView', () => {
    mockUseInView.mockReturnValue(false);
    renderHook(() => useIsInView({ current: null }, { inViewMargin: '-100px' }));
    expect(mockUseInView).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ margin: '-100px' }));
  });
});
