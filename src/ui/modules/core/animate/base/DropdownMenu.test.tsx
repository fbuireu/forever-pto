import { render } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = React.ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  layout?: unknown;
  whileTap?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, layout: _l, whileTap: _wt, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => createElement(Fragment, null, children),
  };
});

vi.mock('@base-ui/react/menu', async () => {
  const { createElement, cloneElement, isValidElement } = await import('react');
  type RootProps = React.ComponentProps<'div'> & {
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    defaultOpen?: boolean;
  };
  type WithRender = React.ComponentProps<'div'> & { render?: React.ReactElement; keepMounted?: boolean };
  type ItemProps = React.ComponentProps<'div'> & { render?: React.ReactElement; disabled?: boolean };
  type SeparatorProps = React.ComponentProps<'hr'>;
  const Menu = {
    Root: ({ children, onOpenChange: _oc, open: _o, defaultOpen: _do, ...props }: RootProps) =>
      createElement('div', { 'data-slot': 'dropdown-menu', ...props }, children),
    Trigger: ({ children, render: renderProp, ...props }: WithRender) =>
      renderProp && isValidElement(renderProp)
        ? cloneElement(renderProp, props)
        : createElement('button', { 'data-slot': 'dropdown-menu-trigger', ...props }, children),
    Portal: ({ children, keepMounted: _km, ...props }: WithRender) => createElement('div', props, children),
    Positioner: ({ children, ...props }: React.ComponentProps<'div'> & { sideOffset?: number; align?: string; positionMethod?: string }) =>
      createElement('div', props, children),
    Popup: ({ children, render: renderProp, ...props }: WithRender) =>
      renderProp && isValidElement(renderProp)
        ? cloneElement(renderProp, props, children)
        : createElement('div', { 'data-slot': 'dropdown-menu-content', ...props }, children),
    Item: ({ children, render: _r, disabled: _d, ...props }: ItemProps) => createElement('div', props, children),
    Group: ({ children, ...props }: React.ComponentProps<'div'>) => createElement('div', props, children),
    GroupLabel: ({ children, ...props }: React.ComponentProps<'div'>) => createElement('div', props, children),
    Separator: (props: SeparatorProps) => createElement('hr', props),
    CheckboxItem: ({ children, render: _r, ...props }: WithRender) => createElement('div', props, children),
    CheckboxItemIndicator: ({ children, ...props }: React.ComponentProps<'span'>) => createElement('span', props, children),
    RadioGroup: ({ children, ...props }: React.ComponentProps<'div'>) => createElement('div', props, children),
    RadioItem: ({ children, render: _r, ...props }: WithRender) => createElement('div', props, children),
    RadioItemIndicator: ({ children, ...props }: React.ComponentProps<'span'>) => createElement('span', props, children),
    SubmenuRoot: ({ children, ...props }: React.ComponentProps<'div'>) => createElement('div', props, children),
    SubmenuTrigger: ({ children, render: _r, ...props }: WithRender) => createElement('div', props, children),
  };
  return { Menu };
});

vi.mock('../effects/MotionHighlight', () => ({
  MotionHighlight: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  MotionHighlightItem: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../icons/Check', () => ({ Check: () => <svg /> }));
vi.mock('../icons/ChevronRight', () => ({ ChevronRight: () => <svg /> }));
vi.mock('lucide-react', () => ({ Circle: () => <svg /> }));

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './DropdownMenu';

describe('DropdownMenu', () => {
  it('renders with data-slot="dropdown-menu"', () => {
    const { container } = render(<DropdownMenu><span /></DropdownMenu>);
    expect(container.querySelector('[data-slot="dropdown-menu"]')).not.toBeNull();
  });

  it('starts closed (isOpen=false)', () => {
    const { container } = render(
      <DropdownMenu>
        <DropdownMenuContent>item</DropdownMenuContent>
      </DropdownMenu>
    );
    expect(container.querySelector('[data-slot="dropdown-menu-content"]')).toBeNull();
  });

  it('opens when defaultOpen=true', () => {
    const { container } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuContent>item</DropdownMenuContent>
      </DropdownMenu>
    );
    expect(container.querySelector('[data-slot="dropdown-menu-content"]')).not.toBeNull();
  });
});

describe('DropdownMenuContent', () => {
  it('throws when rendered outside DropdownMenu', () => {
    expect(() => render(<DropdownMenuContent>item</DropdownMenuContent>)).toThrow(
      'useDropdownMenu must be used within a DropdownMenu'
    );
  });
});

describe('DropdownMenuTrigger', () => {
  it('renders with data-slot="dropdown-menu-trigger"', () => {
    const { container } = render(
      <DropdownMenu>
        <DropdownMenuTrigger>open</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(container.querySelector('[data-slot="dropdown-menu-trigger"]')).not.toBeNull();
  });
});

describe('DropdownMenuItem', () => {
  it('renders inside DropdownMenu without throwing', () => {
    expect(() =>
      render(
        <DropdownMenu>
          <DropdownMenuItem>item</DropdownMenuItem>
        </DropdownMenu>
      )
    ).not.toThrow();
  });
});
