import { render } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = ComponentProps<'div'> & {
  animate?: unknown;
  transition?: unknown;
  initial?: unknown;
  exit?: unknown;
  layout?: unknown;
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
      div: ({ children, animate: _a, transition: _t, initial: _i, exit: _e, layout: _l, ...props }: MotionDivProps) =>
        createElement('div', props, children),
    },
  };
});

vi.mock('@ui/hooks/useAutoHeight', () => ({
  useAutoHeight: () => ({ ref: { current: null }, height: 100 }),
}));

vi.mock('../primitives/animate/MotionSlot', async () => {
  const { createElement } = await import('react');
  return {
    MotionSlot: ({ children, animate: _a, transition: _t, ...props }: MotionSlotMockProps) =>
      createElement('div', { 'data-slot': 'motion-slot', ...props }, children),
  };
});

import { AutoHeight } from './AutoHeight';

describe('AutoHeight', () => {
  it('renders children', () => {
    const { getByText } = render(
      <AutoHeight>
        <span>content</span>
      </AutoHeight>
    );
    expect(getByText('content')).toBeTruthy();
  });

  it('forwards className to the outer element', () => {
    const { container } = render(
      <AutoHeight className='test-class'>
        <span />
      </AutoHeight>
    );
    expect(container.querySelector('.test-class')).not.toBeNull();
  });

  it('forwards extra props to the outer element', () => {
    const { container } = render(
      <AutoHeight data-testid='ah-root'>
        <span />
      </AutoHeight>
    );
    expect(container.querySelector('[data-testid="ah-root"]')).not.toBeNull();
  });

  it('uses MotionSlot when asChild=true', () => {
    const { container } = render(
      <AutoHeight asChild>
        <div>
          <span>child</span>
        </div>
      </AutoHeight>
    );
    expect(container.querySelector('[data-slot="motion-slot"]')).not.toBeNull();
  });

  it('does not use MotionSlot when asChild is not set', () => {
    const { container } = render(
      <AutoHeight>
        <span />
      </AutoHeight>
    );
    expect(container.querySelector('[data-slot="motion-slot"]')).toBeNull();
  });

  it('renders without error when animate is a TargetAndTransition object', () => {
    const { getByText } = render(
      <AutoHeight animate={{ opacity: 1 }}>
        <span>ok</span>
      </AutoHeight>
    );
    expect(getByText('ok')).toBeTruthy();
  });
});
