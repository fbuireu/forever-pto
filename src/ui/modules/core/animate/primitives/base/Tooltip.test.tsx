import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@base-ui/react/tooltip', async () => {
  const { createElement, cloneElement, Fragment } = await import('react');
  type RenderableProps = ComponentProps<'div'> & { render?: ReactElement; keepMounted?: boolean };
  const renderable =
    (slot: string, tag = 'div') =>
    ({ render: renderProp, children, keepMounted: _k, ...props }: RenderableProps) =>
      renderProp
        ? cloneElement(
            renderProp,
            props as Record<string, unknown>,
            children ?? (renderProp.props as { children?: ReactNode }).children
          )
        : createElement(tag, { 'data-slot': slot, ...props }, children);
  return {
    Tooltip: {
      Provider: ({ children }: { children?: ReactNode; delay?: number }) => createElement(Fragment, null, children),
      Root: ({ children }: { children?: ReactNode; open?: boolean; onOpenChange?: unknown }) =>
        createElement(Fragment, null, children),
      Trigger: renderable('base-trigger', 'button'),
      Portal: ({ children }: { children?: ReactNode; keepMounted?: boolean }) =>
        createElement(Fragment, null, children),
      Positioner: renderable('base-positioner'),
      Popup: renderable('base-popup'),
      Arrow: renderable('base-arrow'),
    },
  };
});

import { Tooltip, TooltipPopup, TooltipPortal, TooltipPositioner, TooltipTrigger } from './Tooltip';

const stubHoverCapability = (canHover: boolean) => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: !canHover }));
};

const renderTooltip = () =>
  render(
    <Tooltip>
      <TooltipTrigger>info</TooltipTrigger>
      <TooltipPortal>
        <TooltipPositioner>
          <TooltipPopup>tip content</TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </Tooltip>
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Tooltip tap support on touch devices', () => {
  it('opens on trigger click when the device cannot hover', () => {
    stubHoverCapability(false);
    renderTooltip();
    expect(screen.queryByText('tip content')).toBeNull();

    fireEvent.click(screen.getByText('info'));
    expect(screen.queryByText('tip content')).not.toBeNull();
  });

  it('toggles closed on a second trigger click', () => {
    stubHoverCapability(false);
    renderTooltip();
    const trigger = screen.getByText('info');

    fireEvent.click(trigger);
    expect(screen.queryByText('tip content')).not.toBeNull();

    fireEvent.click(trigger);
    expect(screen.queryByText('tip content')).toBeNull();
  });

  it('dismisses on pointerdown outside the trigger', () => {
    stubHoverCapability(false);
    renderTooltip();

    fireEvent.click(screen.getByText('info'));
    expect(screen.queryByText('tip content')).not.toBeNull();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByText('tip content')).toBeNull();
  });

  it('does not toggle on click when the device can hover', () => {
    stubHoverCapability(true);
    renderTooltip();

    fireEvent.click(screen.getByText('info'));
    expect(screen.queryByText('tip content')).toBeNull();
  });
});
