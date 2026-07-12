import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
    },
    AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
    useMotionValue: () => ({ set: vi.fn() }),
    useSpring: () => ({ set: vi.fn() }),
  };
});

vi.mock('@base-ui/react/popover', async () => {
  const { createElement, cloneElement, Fragment } = await import('react');
  type TriggerProps = ComponentProps<'button'> & {
    render?: ReactElement;
    openOnHover?: boolean;
    delay?: number;
  };
  type RenderableProps = ComponentProps<'div'> & { render?: ReactElement; keepMounted?: boolean };
  const renderable =
    (slot: string) =>
    ({ render: renderProp, children, keepMounted: _k, ...props }: RenderableProps) =>
      renderProp
        ? cloneElement(
            renderProp,
            props as Record<string, unknown>,
            children ?? (renderProp.props as { children?: ReactNode }).children
          )
        : createElement('div', { 'data-slot': slot, ...props }, children);
  return {
    Popover: {
      Root: ({ children }: { children?: ReactNode; open?: boolean; onOpenChange?: unknown }) =>
        createElement(Fragment, null, children),
      Trigger: ({ children, openOnHover, delay, ...props }: TriggerProps) =>
        createElement(
          'button',
          { 'data-open-on-hover': String(openOnHover), 'data-delay': String(delay), ...props },
          children
        ),
      Portal: ({ children }: { children?: ReactNode; keepMounted?: boolean }) =>
        createElement(Fragment, null, children),
      Positioner: renderable('base-positioner'),
      Popup: renderable('base-popup'),
      Arrow: renderable('base-arrow'),
    },
  };
});

import { Tooltip, TooltipPopup, TooltipPortal, TooltipPositioner, TooltipProvider, TooltipTrigger } from './Tooltip';

const renderTooltip = (ui?: { delay?: number; triggerDelay?: number; defaultOpen?: boolean }) =>
  render(
    <TooltipProvider delay={ui?.delay}>
      <Tooltip defaultOpen={ui?.defaultOpen}>
        <TooltipTrigger delay={ui?.triggerDelay}>info</TooltipTrigger>
        <TooltipPortal>
          <TooltipPositioner>
            <TooltipPopup>tip content</TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );

describe('Tooltip (popover-based, touch-capable)', () => {
  it('enables openOnHover on the trigger so hover and tap both open it', () => {
    renderTooltip();
    expect(screen.getByText('info').getAttribute('data-open-on-hover')).toBe('true');
  });

  it('threads the provider delay into the trigger', () => {
    renderTooltip({ delay: 200 });
    expect(screen.getByText('info').getAttribute('data-delay')).toBe('200');
  });

  it('lets an explicit trigger delay override the provider delay', () => {
    renderTooltip({ delay: 200, triggerDelay: 50 });
    expect(screen.getByText('info').getAttribute('data-delay')).toBe('50');
  });

  it('renders the popup only while open', () => {
    renderTooltip();
    expect(screen.queryByText('tip content')).toBeNull();
  });

  it('renders the popup when open', () => {
    renderTooltip({ defaultOpen: true });
    expect(screen.queryByText('tip content')).not.toBeNull();
  });
});
