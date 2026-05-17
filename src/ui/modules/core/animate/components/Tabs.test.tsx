import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  layout?: unknown;
  transition?: unknown;
  variants?: unknown;
  custom?: unknown;
};

type MotionButtonProps = ComponentProps<'button'> & {
  whileTap?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, animate: _a, exit: _e, layout: _l, transition: _t, variants: _v, custom: _c, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
      button: ({ children, whileTap: _wt, ...props }: MotionButtonProps) =>
        createElement('button', props, children),
    },
    AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
  };
});

vi.mock('../effects/AutoHeight', () => ({
  AutoHeight: ({ children, deps: _d, ...props }: ComponentProps<'div'> & { deps?: unknown }) =>
    <div {...props}>{children}</div>,
}));

vi.mock('../effects/MotionHighlight', () => ({
  MotionHighlight: ({ children }: { children?: ReactNode }) => <>{children}</>,
  MotionHighlightItem: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from './Tabs';

describe('Tabs', () => {
  it('renders with data-slot="tabs"', () => {
    const { container } = render(<Tabs><span /></Tabs>);
    expect(container.querySelector('[data-slot="tabs"]')).not.toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(<Tabs className='my-tabs'><span /></Tabs>);
    expect(container.querySelector('[data-slot="tabs"]')?.className).toContain('my-tabs');
  });
});

describe('TabsList', () => {
  it('has role="tablist"', () => {
    const { getByRole } = render(<Tabs><TabsList /></Tabs>);
    expect(getByRole('tablist')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { getByRole } = render(<Tabs><TabsList className='list-class' /></Tabs>);
    expect(getByRole('tablist').className).toContain('list-class');
  });
});

describe('TabsTrigger', () => {
  it('has role="tab"', () => {
    const { getByRole } = render(
      <Tabs><TabsList><TabsTrigger value='a'>A</TabsTrigger></TabsList></Tabs>
    );
    expect(getByRole('tab')).toBeTruthy();
  });

  it('has data-state="active" when it matches the default value', () => {
    const { getByRole } = render(
      <Tabs defaultValue='a'>
        <TabsList><TabsTrigger value='a'>A</TabsTrigger></TabsList>
      </Tabs>
    );
    expect(getByRole('tab').dataset.state).toBe('active');
  });

  it('has data-state="inactive" when it does not match the default value', () => {
    const { getAllByRole } = render(
      <Tabs defaultValue='a'>
        <TabsList>
          <TabsTrigger value='a'>A</TabsTrigger>
          <TabsTrigger value='b'>B</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(getAllByRole('tab')[1].dataset.state).toBe('inactive');
  });

  it('calls onValueChange with the tab value when clicked', () => {
    const onValueChange = vi.fn();
    const { getByText } = render(
      <Tabs defaultValue='a' onValueChange={onValueChange}>
        <TabsList><TabsTrigger value='b'>B</TabsTrigger></TabsList>
      </Tabs>
    );
    fireEvent.click(getByText('B'));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('becomes active after being clicked', () => {
    const { getByText } = render(
      <Tabs defaultValue='a'>
        <TabsList>
          <TabsTrigger value='a'>A</TabsTrigger>
          <TabsTrigger value='b'>B</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    fireEvent.click(getByText('B'));
    expect((getByText('B') as HTMLElement).dataset.state).toBe('active');
    expect((getByText('A') as HTMLElement).dataset.state).toBe('inactive');
  });

  it('respects controlled value prop', () => {
    const { getAllByRole } = render(
      <Tabs value='b'>
        <TabsList>
          <TabsTrigger value='a'>A</TabsTrigger>
          <TabsTrigger value='b'>B</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(getAllByRole('tab')[0].dataset.state).toBe('inactive');
    expect(getAllByRole('tab')[1].dataset.state).toBe('active');
  });
});

describe('TabsContent', () => {
  it('has role="tabpanel"', () => {
    const { getByRole } = render(
      <Tabs defaultValue='a'>
        <TabsContents>
          <TabsContent value='a'>Panel A</TabsContent>
        </TabsContents>
      </Tabs>
    );
    expect(getByRole('tabpanel')).toBeTruthy();
  });

  it('renders only the active tab content', () => {
    const { getByText, queryByText } = render(
      <Tabs defaultValue='a'>
        <TabsContents>
          <TabsContent value='a'>Panel A</TabsContent>
          <TabsContent value='b'>Panel B</TabsContent>
        </TabsContents>
      </Tabs>
    );
    expect(getByText('Panel A')).toBeTruthy();
    expect(queryByText('Panel B')).toBeNull();
  });

  it('switches to new content after clicking a trigger', () => {
    const { getByText, queryByText } = render(
      <Tabs defaultValue='a'>
        <TabsList>
          <TabsTrigger value='a'>A</TabsTrigger>
          <TabsTrigger value='b'>B</TabsTrigger>
        </TabsList>
        <TabsContents>
          <TabsContent value='a'>Panel A</TabsContent>
          <TabsContent value='b'>Panel B</TabsContent>
        </TabsContents>
      </Tabs>
    );
    fireEvent.click(getByText('B'));
    expect(queryByText('Panel A')).toBeNull();
    expect(getByText('Panel B')).toBeTruthy();
  });
});
