import deMessages from '@i18n/messages/de.json';
import itMessages from '@i18n/messages/it.json';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('recharts', () => {
  const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const empty = () => null;
  return {
    Bar: passthrough,
    BarChart: passthrough,
    CartesianGrid: empty,
    Cell: empty,
    ResponsiveContainer: passthrough,
    Tooltip: empty,
    XAxis: empty,
    YAxis: empty,
  };
});

vi.mock('@ui/modules/premium/PremiumFeature', () => ({
  PremiumFeature: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { BlocksPerQuarterChart } from './BlocksPerQuarterChart';

const renderChart = (locale: string, messages: object, blocksPerQuarter: number[]) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <BlocksPerQuarterChart blocksPerQuarter={blocksPerQuarter} />
    </NextIntlClientProvider>
  );

describe('BlocksPerQuarterChart', () => {
  it('pluralises the block count with Italian plural rules', () => {
    const { container } = renderChart('it', itMessages, [2, 1, 0, 0]);
    expect(container.textContent).toContain('2 blocchi');
  });

  it('pluralises the block count with German plural rules', () => {
    const { container } = renderChart('de', deMessages, [2, 1, 0, 0]);
    expect(container.textContent).toContain('2 Blöcke');
  });

  it('uses the singular form for a single block', () => {
    const { container } = renderChart('it', itMessages, [1, 0, 0, 0]);
    expect(container.textContent).toContain('con 1 blocco.');
    expect(container.textContent).not.toContain('con 1 blocchi');
  });
});
