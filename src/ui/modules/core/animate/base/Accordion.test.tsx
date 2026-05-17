import { render } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  layout?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, layout: _l, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
    },
    AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
  };
});

vi.mock('@base-ui/react/accordion', async () => {
  const { createElement, forwardRef } = await import('react');
  return {
    Accordion: {
      Root: ({ children, ...props }: ComponentProps<'div'>) =>
        createElement('div', { 'data-slot': 'accordion', ...props }, children),
      Item: ({ children, ...props }: ComponentProps<'div'>) =>
        createElement('div', { 'data-slot': 'accordion-item', ...props }, children),
      Header: ({ children, ...props }: ComponentProps<'div'>) =>
        createElement('div', { 'data-slot': 'accordion-header', ...props }, children),
      Trigger: forwardRef<HTMLButtonElement, ComponentProps<'button'>>(({ children, ...props }, ref) =>
        createElement('button', { ref, 'data-slot': 'accordion-trigger', ...props }, children)
      ),
      Panel: ({ children, ...props }: ComponentProps<'div'> & { render?: unknown; keepMounted?: boolean; hidden?: boolean }) =>
        createElement('div', { 'data-slot': 'accordion-panel', ...props }, children),
    },
  };
});

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from './Accordion';

describe('Accordion', () => {
  it('renders with data-slot="accordion"', () => {
    const { container } = render(<Accordion />);
    expect(container.querySelector('[data-slot="accordion"]')).not.toBeNull();
  });
});

describe('AccordionItem', () => {
  it('renders with data-slot="accordion-item"', () => {
    const { container } = render(<AccordionItem value='item-1'><span /></AccordionItem>);
    expect(container.querySelector('[data-slot="accordion-item"]')).not.toBeNull();
  });

  it('applies additional className', () => {
    const { container } = render(
      <AccordionItem value='item-1' className='custom'>
        <span />
      </AccordionItem>
    );
    const el = container.querySelector('[data-slot="accordion-item"]');
    expect(el?.className).toContain('custom');
  });
});

describe('AccordionTrigger', () => {
  it('throws when used outside AccordionItem', () => {
    expect(() =>
      render(<AccordionTrigger>trigger</AccordionTrigger>)
    ).toThrow('useAccordionItem must be used within an AccordionItem');
  });

  it('renders inside AccordionItem without throwing', () => {
    expect(() =>
      render(
        <AccordionItem value='item-1'>
          <AccordionTrigger>trigger</AccordionTrigger>
        </AccordionItem>
      )
    ).not.toThrow();
  });
});

describe('AccordionPanel', () => {
  it('throws when used outside AccordionItem', () => {
    expect(() => render(<AccordionPanel>content</AccordionPanel>)).toThrow(
      'useAccordionItem must be used within an AccordionItem'
    );
  });
});
