import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  layout?: unknown;
  transition?: unknown;
};

type MotionButtonProps = ComponentProps<'button'> & {
  whileTap?: unknown;
  transition?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, animate: _a, layout: _l, transition: _t, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
      button: ({ children, whileTap: _wt, transition: _t, ...props }: MotionButtonProps) =>
        createElement('button', props, children),
    },
  };
});

vi.mock('../text/SlidingNumber', () => ({
  SlidingNumber: ({ number }: { number: number }) => (
    <span data-testid='sliding-number'>{number}</span>
  ),
}));

import { Counter } from './Counter';

describe('Counter', () => {
  it('renders with data-slot="counter"', () => {
    const { container } = render(<Counter number={5} setNumber={vi.fn()} />);
    expect(container.querySelector('[data-slot="counter"]')).not.toBeNull();
  });

  it('displays the current number', () => {
    const { getByTestId } = render(<Counter number={7} setNumber={vi.fn()} />);
    expect(getByTestId('sliding-number').textContent).toBe('7');
  });

  it('calls setNumber with number - 1 on decrement click', () => {
    const setNumber = vi.fn();
    const { getByText } = render(<Counter number={5} setNumber={setNumber} />);
    fireEvent.click(getByText('−'));
    expect(setNumber).toHaveBeenCalledWith(4);
  });

  it('calls setNumber with number + 1 on increment click', () => {
    const setNumber = vi.fn();
    const { getByText } = render(<Counter number={5} setNumber={setNumber} />);
    fireEvent.click(getByText('+'));
    expect(setNumber).toHaveBeenCalledWith(6);
  });

  it('renders the label when provided', () => {
    const { getByText } = render(<Counter number={5} setNumber={vi.fn()} label='days' />);
    expect(getByText('days')).toBeTruthy();
  });

  it('does not render a label element when label is omitted', () => {
    const { container } = render(<Counter number={5} setNumber={vi.fn()} />);
    expect(container.querySelector('small')).toBeNull();
  });

  it('applies custom className to the wrapper', () => {
    const { container } = render(<Counter number={5} setNumber={vi.fn()} className='my-class' />);
    expect(container.querySelector('[data-slot="counter"]')?.className).toContain('my-class');
  });

  it('disables decrement button via decrementButtonProps', () => {
    const { getByText } = render(
      <Counter number={5} setNumber={vi.fn()} decrementButtonProps={{ disabled: true }} />
    );
    expect((getByText('−') as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not disable increment when only decrementButtonProps.disabled is set', () => {
    const { getByText } = render(
      <Counter number={5} setNumber={vi.fn()} decrementButtonProps={{ disabled: true }} />
    );
    expect((getByText('+') as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables increment button via incrementButtonProps', () => {
    const { getByText } = render(
      <Counter number={5} setNumber={vi.fn()} incrementButtonProps={{ disabled: true }} />
    );
    expect((getByText('+') as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not disable decrement when only incrementButtonProps.disabled is set', () => {
    const { getByText } = render(
      <Counter number={5} setNumber={vi.fn()} incrementButtonProps={{ disabled: true }} />
    );
    expect((getByText('−') as HTMLButtonElement).disabled).toBe(false);
  });
});
