import { render } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionSpanProps = ComponentProps<'span'> & {
  animate?: unknown;
  transition?: unknown;
  initial?: unknown;
  exit?: unknown;
};

type MotionSlotMockProps = ComponentProps<'div'> & {
  animate?: unknown;
  transition?: unknown;
  children: ReactNode;
};

vi.mock('motion/react', async () => {
  const { createElement } = await import('react');
  return {
    m: {
      span: ({ children, animate: _a, transition: _t, initial: _i, exit: _e, ...props }: MotionSpanProps) =>
        createElement('span', props, children),
    },
    useAnimation: () => ({
      start: () => Promise.resolve(),
      set: () => undefined,
    }),
  };
});

vi.mock('@ui/hooks/useIsInView', () => ({
  useIsInView: () => ({ ref: { current: null }, isInView: false }),
}));

vi.mock('../primitives/animate/MotionSlot', async () => {
  const { createElement } = await import('react');
  return {
    MotionSlot: ({ children, animate: _a, transition: _t, ...props }: MotionSlotMockProps) =>
      createElement('div', { 'data-slot': 'motion-slot', ...props }, children),
  };
});

import { AnimateIcon, IconWrapper, useAnimateIconContext } from './Icon';

const PersistProbe = () => {
  const { persistOnAnimateEnd } = useAnimateIconContext();
  return <span data-testid='persist'>{String(persistOnAnimateEnd)}</span>;
};

describe('AnimateIcon', () => {
  it('exposes persistOnAnimateEnd to its own children', () => {
    const { getByTestId } = render(
      <AnimateIcon persistOnAnimateEnd>
        <PersistProbe />
      </AnimateIcon>
    );

    expect(getByTestId('persist').textContent).toBe('true');
  });

  it('propagates persistOnAnimateEnd to a nested icon that inherits the parent animation', () => {
    const { getByTestId } = render(
      <AnimateIcon persistOnAnimateEnd>
        <IconWrapper icon={PersistProbe} />
      </AnimateIcon>
    );

    expect(getByTestId('persist').textContent).toBe('true');
  });

  it('propagates persistOnAnimateEnd to a nested icon that overrides another prop', () => {
    const { getByTestId } = render(
      <AnimateIcon persistOnAnimateEnd>
        <IconWrapper icon={PersistProbe} loop />
      </AnimateIcon>
    );

    expect(getByTestId('persist').textContent).toBe('true');
  });
});
