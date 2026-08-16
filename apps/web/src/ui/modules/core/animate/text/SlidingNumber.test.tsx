import { render } from '@testing-library/react';
import { type Locale, NextIntlClientProvider } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionSpanProps = ComponentProps<'span'> & { style?: unknown; transition?: unknown };

vi.mock('motion/react', async () => {
  const { createElement } = await import('react');
  return {
    m: {
      span: ({ children, style: _s, transition: _t, ...props }: MotionSpanProps) =>
        createElement('span', props, children),
    },
    useInView: () => true,
    useSpring: () => ({ set: vi.fn() }),
    useTransform: () => 0,
  };
});

vi.mock('react-use-measure', () => ({ default: () => [vi.fn(), { height: 0 }] }));

import { SlidingNumber } from './SlidingNumber';

const renderIn = (locale: Locale, children: ReactNode) =>
  render(<NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>);

const separatorOf = (container: HTMLElement) =>
  container.querySelector('[data-slot="sliding-number"]')?.textContent ?? '';

describe('SlidingNumber', () => {
  it('uses the comma decimal separator in a comma-decimal locale', () => {
    const { container } = renderIn('es', <SlidingNumber number={2.4} decimalPlaces={1} />);
    expect(separatorOf(container)).toContain(',');
  });

  it('uses the dot decimal separator in a dot-decimal locale', () => {
    const { container } = renderIn('en', <SlidingNumber number={2.4} decimalPlaces={1} />);
    expect(separatorOf(container)).toContain('.');
    expect(separatorOf(container)).not.toContain(',');
  });

  it('honours an explicit decimalSeparator over the locale default', () => {
    const { container } = renderIn('es', <SlidingNumber number={2.4} decimalPlaces={1} decimalSeparator='·' />);
    expect(separatorOf(container)).toContain('·');
    expect(separatorOf(container)).not.toContain(',');
  });

  it('renders no separator when there are no decimals', () => {
    const { container } = renderIn('de', <SlidingNumber number={2026} />);
    expect(separatorOf(container)).not.toContain(',');
    expect(separatorOf(container)).not.toContain('.');
  });
});
