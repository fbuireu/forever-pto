import { fireEvent, render } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionButtonProps = React.ComponentProps<'button'> & {
  whileTap?: unknown;
  whileHover?: unknown;
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};
type MotionSvgProps = React.ComponentProps<'svg'> & { initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown };
type MotionPathProps = React.ComponentProps<'path'> & { variants?: unknown };

vi.mock('motion/react', async () => {
  const { createElement, Fragment, forwardRef } = await import('react');
  return {
    m: {
      button: forwardRef<HTMLButtonElement, MotionButtonProps>(
        ({ children, whileTap: _wt, whileHover: _wh, initial: _i, animate: _a, exit: _e, transition: _t, ...props }, ref) =>
          createElement('button', { ref, ...props }, children)
      ),
      svg: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, ...props }: MotionSvgProps) =>
        createElement('svg', props, children),
      path: ({ variants: _v, strokeLinecap, strokeLinejoin, ...props }: MotionPathProps) =>
        createElement('path', { strokeLinecap, strokeLinejoin, ...props }),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => createElement(Fragment, null, children),
  };
});

vi.mock('@base-ui/react/checkbox', async () => {
  const { createElement, forwardRef } = await import('react');
  type RootProps = React.ComponentProps<'button'> & {
    onCheckedChange?: (checked: boolean, details: Record<string, unknown>) => void;
    checked?: boolean;
    defaultChecked?: boolean;
    render?: React.ReactElement;
    keepMounted?: boolean;
  };
  const Root = forwardRef<HTMLButtonElement, RootProps>(
    ({ children, onCheckedChange, checked, defaultChecked: _dc, render: _r, keepMounted: _km, ...props }, ref) =>
      createElement(
        'button',
        { ref, 'data-slot': 'checkbox', 'data-checked': checked, onClick: () => onCheckedChange?.(!checked, {}), ...props },
        children
      )
  );
  Root.displayName = 'Checkbox.Root';
  return {
    Checkbox: {
      Root,
      Indicator: ({ children, keepMounted: _km, ...props }: React.ComponentProps<'span'> & { keepMounted?: boolean }) =>
        createElement('span', props, children),
    },
  };
});

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    const { container } = render(<Checkbox />);
    expect(container.querySelector('[data-checked="true"]')).toBeNull();
  });

  it('renders checked when defaultChecked=true', () => {
    const { container } = render(<Checkbox defaultChecked />);
    expect(container.querySelector('[data-slot="checkbox"]')).not.toBeNull();
  });

  it('calls onCheckedChange when clicked', () => {
    const spy = vi.fn();
    const { container } = render(<Checkbox checked={false} onCheckedChange={spy} />);
    const root = container.querySelector('[data-slot="checkbox"]') as HTMLButtonElement;
    fireEvent.click(root);
    expect(spy).toHaveBeenCalledWith(true, {});
  });

  it('syncs internal state when controlled checked prop changes', () => {
    const { rerender, container } = render(<Checkbox checked={false} />);
    rerender(<Checkbox checked={true} />);
    const root = container.querySelector('[data-slot="checkbox"]') as HTMLButtonElement;
    expect(root.dataset.checked).toBe('true');
  });

  it('renders with data-slot="checkbox"', () => {
    const { container } = render(<Checkbox />);
    expect(container.querySelector('[data-slot="checkbox"]')).not.toBeNull();
  });
});
