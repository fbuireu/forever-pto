import { act, render } from '@testing-library/react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
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
      div: ({
        children,
        initial: _i,
        animate,
        exit: _e,
        transition: _t,
        layout: _l,
        style,
        ...props
      }: MotionDivProps) =>
        createElement('div', { style, ...props, 'data-animate': JSON.stringify(animate ?? null) }, children),
    },
    AnimatePresence: ({ children }: { children?: ReactNode }) => createElement(Fragment, null, children),
  };
});

vi.mock('@base-ui/react/accordion', async () => {
  const { createElement, forwardRef, cloneElement, isValidElement } = await import('react');
  return {
    Accordion: {
      Root: ({ children, ...props }: ComponentProps<'div'>) => createElement('div', props, children),
      Item: ({ children, ...props }: ComponentProps<'div'>) => createElement('div', props, children),
      Header: ({ children, ...props }: ComponentProps<'div'>) => createElement('div', props, children),
      Trigger: forwardRef<HTMLButtonElement, ComponentProps<'button'>>(({ children, ...props }, ref) =>
        createElement('button', { ref, ...props }, children)
      ),
      Panel: ({
        children,
        render: renderProp,
        keepMounted: _km,
        hidden: _h,
        ...props
      }: ComponentProps<'div'> & { render?: ReactElement; keepMounted?: boolean; hidden?: boolean }) =>
        isValidElement(renderProp) ? cloneElement(renderProp, props) : createElement('div', props, children),
    },
  };
});

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from './Accordion';

const openPrimitive = async (trigger: Element) => {
  await act(async () => {
    trigger.setAttribute('data-panel-open', '');
  });
};

describe('Accordion', () => {
  it('renders with data-slot="accordion"', () => {
    const { container } = render(<Accordion />);
    expect(container.querySelector('[data-slot="accordion"]')).not.toBeNull();
  });
});

describe('AccordionItem', () => {
  it('renders with data-slot="accordion-item"', () => {
    const { container } = render(
      <AccordionItem value='item-1'>
        <span />
      </AccordionItem>
    );
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
    expect(() => render(<AccordionTrigger>trigger</AccordionTrigger>)).toThrow(
      'useAccordionItem must be used within an AccordionItem'
    );
  });

  it('renders with data-slot="accordion-trigger" inside AccordionItem', () => {
    const { container } = render(
      <AccordionItem value='item-1'>
        <AccordionTrigger>trigger</AccordionTrigger>
      </AccordionItem>
    );
    expect(container.querySelector('[data-slot="accordion-trigger"]')).not.toBeNull();
  });

  it('rotates the chevron once the primitive marks the panel open', async () => {
    const { container } = render(
      <AccordionItem value='item-1'>
        <AccordionTrigger>trigger</AccordionTrigger>
      </AccordionItem>
    );
    const chevron = () => container.querySelector('[data-slot="accordion-trigger-chevron"]');
    expect(chevron()?.getAttribute('data-animate')).toBe(JSON.stringify({ rotate: 0 }));

    await openPrimitive(container.querySelector('[data-slot="accordion-trigger"]') as Element);

    expect(chevron()?.getAttribute('data-animate')).toBe(JSON.stringify({ rotate: 45 }));
  });
});

describe('AccordionPanel', () => {
  it('throws when used outside AccordionItem', () => {
    expect(() => render(<AccordionPanel>content</AccordionPanel>)).toThrow(
      'useAccordionItem must be used within an AccordionItem'
    );
  });

  it('stays unmounted until the primitive marks the panel open, then renders its content', async () => {
    const { container, queryByText } = render(
      <AccordionItem value='item-1'>
        <AccordionTrigger>trigger</AccordionTrigger>
        <AccordionPanel>content</AccordionPanel>
      </AccordionItem>
    );
    expect(container.querySelector('[data-slot="accordion-panel"]')).toBeNull();
    expect(queryByText('content')).toBeNull();

    await openPrimitive(container.querySelector('[data-slot="accordion-trigger"]') as Element);

    expect(container.querySelector('[data-slot="accordion-panel"]')).not.toBeNull();
    expect(queryByText('content')).not.toBeNull();
  });
});
