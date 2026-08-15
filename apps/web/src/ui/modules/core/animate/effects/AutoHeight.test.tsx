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

const { measuredRef } = vi.hoisted(() => ({
  measuredRef: { current: null as HTMLElement | null },
}));

vi.mock('motion/react', async () => {
  const { createElement } = await import('react');
  return {
    m: {
      div: ({ children, animate, transition: _t, initial: _i, exit: _e, layout: _l, ...props }: MotionDivProps) =>
        createElement('div', { ...props, 'data-animate': JSON.stringify(animate ?? null) }, children),
    },
  };
});

vi.mock('@ui/hooks/useAutoHeight', () => ({
  useAutoHeight: () => ({ ref: measuredRef, height: 100 }),
}));

vi.mock('../primitives/animate/MotionSlot', async () => {
  const { createElement } = await import('react');
  return {
    MotionSlot: ({ children, animate, transition: _t, ...props }: MotionSlotMockProps) =>
      createElement(
        'div',
        { ...props, 'data-slot': 'motion-slot', 'data-animate': JSON.stringify(animate ?? null) },
        children
      ),
  };
});

import { AutoHeight } from './AutoHeight';

function readAnimate(element: Element | null) {
  return JSON.parse(element?.getAttribute('data-animate') ?? 'null');
}

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

  it('attaches the measuring ref to the wrapper around the children', () => {
    const { getByText } = render(
      <AutoHeight>
        <span>measured</span>
      </AutoHeight>
    );
    expect(measuredRef.current?.contains(getByText('measured'))).toBe(true);
  });

  it('animates the measured height', () => {
    const { container } = render(
      <AutoHeight data-testid='ah-root'>
        <span />
      </AutoHeight>
    );
    expect(readAnimate(container.querySelector('[data-testid="ah-root"]'))).toEqual({ height: 100 });
  });

  it('merges the measured height into a TargetAndTransition animate', () => {
    const { container } = render(
      <AutoHeight data-testid='ah-root' animate={{ opacity: 1 }}>
        <span />
      </AutoHeight>
    );
    expect(readAnimate(container.querySelector('[data-testid="ah-root"]'))).toEqual({ height: 100, opacity: 1 });
  });

  it('ignores a non-target animate value and animates height alone', () => {
    const { container } = render(
      <AutoHeight data-testid='ah-root' animate='visible'>
        <span />
      </AutoHeight>
    );
    expect(readAnimate(container.querySelector('[data-testid="ah-root"]'))).toEqual({ height: 100 });
  });

  it('passes the merged animate through MotionSlot when asChild=true', () => {
    const { container } = render(
      <AutoHeight asChild animate={{ opacity: 1 }}>
        <div>
          <span>child</span>
        </div>
      </AutoHeight>
    );
    expect(readAnimate(container.querySelector('[data-slot="motion-slot"]'))).toEqual({ height: 100, opacity: 1 });
  });
});
