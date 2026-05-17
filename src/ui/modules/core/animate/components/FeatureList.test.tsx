import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

type MotionDivProps = ComponentProps<'div'> & {
  initial?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  transition?: unknown;
  variants?: unknown;
  style?: Record<string, unknown>;
};

type MotionSpanProps = ComponentProps<'span'> & {
  variants?: unknown;
  transition?: unknown;
};

vi.mock('motion/react', async () => {
  const { createElement } = await import('react');
  return {
    m: {
      div: ({ children, initial: _i, whileHover: _wh, whileTap: _wt, transition: _t, style, ...props }: MotionDivProps) =>
        createElement('div', { style, ...props }, children),
      span: ({ children, variants: _v, transition: _t, ...props }: MotionSpanProps) =>
        createElement('span', props, children),
    },
  };
});

vi.mock('@ui/modules/core/primitives/Badge', () => ({
  Badge: ({ children, ...props }: ComponentProps<'span'>) => (
    <span data-testid='badge' {...props}>{children}</span>
  ),
}));

import { FeatureList } from './FeatureList';

const FEATURES = [
  { id: '1', title: 'Feature One', description: 'Description one', quarter: 'Q1 2025' },
  { id: '2', title: 'Feature Two', description: 'Description two' },
];

describe('FeatureList', () => {
  it('renders all feature titles', () => {
    const { getByText } = render(
      <FeatureList features={FEATURES} categoryLabel='Category' detailedViewLabel='View all' />
    );
    expect(getByText('Feature One')).toBeTruthy();
    expect(getByText('Feature Two')).toBeTruthy();
  });

  it('renders all feature descriptions', () => {
    const { getByText } = render(
      <FeatureList features={FEATURES} categoryLabel='Category' detailedViewLabel='View all' />
    );
    expect(getByText('Description one')).toBeTruthy();
    expect(getByText('Description two')).toBeTruthy();
  });

  it('shows a quarter badge when the feature has a quarter', () => {
    const { getAllByTestId } = render(
      <FeatureList features={FEATURES} categoryLabel='Category' detailedViewLabel='View all' />
    );
    const badges = getAllByTestId('badge');
    expect(badges).toHaveLength(1);
    expect(badges[0].textContent).toBe('Q1 2025');
  });

  it('does not show a badge when quarter is absent', () => {
    const { queryAllByTestId } = render(
      <FeatureList
        features={[{ id: '1', title: 'No quarter', description: 'desc' }]}
        categoryLabel='Category'
        detailedViewLabel='View all'
      />
    );
    expect(queryAllByTestId('badge')).toHaveLength(0);
  });

  it('shows the feature count', () => {
    const { getByText } = render(
      <FeatureList features={FEATURES} categoryLabel='Category' detailedViewLabel='View all' />
    );
    expect(getByText('2')).toBeTruthy();
  });

  it('shows the categoryLabel', () => {
    const { getByText } = render(
      <FeatureList features={FEATURES} categoryLabel='Roadmap' detailedViewLabel='View all' />
    );
    expect(getByText('Roadmap')).toBeTruthy();
  });

  it('shows the detailedViewLabel', () => {
    const { getByText } = render(
      <FeatureList features={FEATURES} categoryLabel='Category' detailedViewLabel='See details' />
    );
    expect(getByText('See details')).toBeTruthy();
  });

  it('renders without throwing with an empty features array', () => {
    expect(() =>
      render(<FeatureList features={[]} categoryLabel='Category' detailedViewLabel='View all' />)
    ).not.toThrow();
  });
});
