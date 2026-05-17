import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
  style?: Record<string, unknown>;
};

type MotionButtonProps = ComponentProps<'button'> & {
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
  variants?: unknown;
  whileTap?: unknown;
};

type MotionSpanProps = ComponentProps<'span'> & {
  variants?: unknown;
  transition?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, animate: _a, transition: _t, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
      button: ({ children, initial: _i, animate: _a, transition: _t, variants: _v, whileTap: _wt, style, ...props }: MotionButtonProps) =>
        createElement('button', { style, ...props }, children),
      span: ({ children, variants: _v, transition: _t, ...props }: MotionSpanProps) =>
        createElement('span', props, children),
    },
  };
});

vi.mock('lucide-react', () => ({
  MousePointer2: () => null,
}));

import { RadialNav } from './RadialNav';

const MockIcon = () => <svg />;

const ITEMS = [
  { id: 1, icon: MockIcon, label: 'Item 1', angle: 0 },
  { id: 2, icon: MockIcon, label: 'Item 2', angle: 120 },
  { id: 3, icon: MockIcon, label: 'Item 3', angle: 240 },
];

describe('RadialNav', () => {
  it('renders without throwing', () => {
    expect(() => render(<RadialNav items={ITEMS} />)).not.toThrow();
  });

  it('has role="menu"', () => {
    const { getByRole } = render(<RadialNav items={ITEMS} />);
    expect(getByRole('menu')).toBeTruthy();
  });

  it('renders a button for each item', () => {
    const { getAllByRole } = render(<RadialNav items={ITEMS} />);
    expect(getAllByRole('menuitem')).toHaveLength(3);
  });

  it('renders each item with its aria-label', () => {
    const { getByRole } = render(<RadialNav items={ITEMS} />);
    expect(getByRole('menuitem', { name: 'Item 1' })).toBeTruthy();
    expect(getByRole('menuitem', { name: 'Item 2' })).toBeTruthy();
    expect(getByRole('menuitem', { name: 'Item 3' })).toBeTruthy();
  });

  it('calls onActiveChange with the item id when clicked', () => {
    const onActiveChange = vi.fn();
    const { getByRole } = render(<RadialNav items={ITEMS} onActiveChange={onActiveChange} />);
    fireEvent.click(getByRole('menuitem', { name: 'Item 2' }));
    expect(onActiveChange).toHaveBeenCalledWith(2);
  });

  it('marks the defaultActiveId item as active', () => {
    const { getByRole } = render(<RadialNav items={ITEMS} defaultActiveId={1} />);
    expect(getByRole('menuitem', { name: 'Item 1' }).className).toContain('bg-accent');
  });

  it('does not mark any item as active when defaultActiveId is not set', () => {
    const { getAllByRole } = render(<RadialNav items={ITEMS} />);
    for (const btn of getAllByRole('menuitem')) {
      expect(btn.className).not.toContain('bg-accent');
    }
  });

  it('activates the clicked item', () => {
    const { getByRole } = render(<RadialNav items={ITEMS} />);
    fireEvent.click(getByRole('menuitem', { name: 'Item 3' }));
    expect(getByRole('menuitem', { name: 'Item 3' }).className).toContain('bg-accent');
  });

  it('deactivates the previous item after clicking another', () => {
    const { getByRole } = render(<RadialNav items={ITEMS} defaultActiveId={1} />);
    fireEvent.click(getByRole('menuitem', { name: 'Item 2' }));
    expect(getByRole('menuitem', { name: 'Item 1' }).className).not.toContain('bg-accent');
    expect(getByRole('menuitem', { name: 'Item 2' }).className).toContain('bg-accent');
  });
});
