import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTER_STRATEGY, FilterStrategy, isFilterStrategy } from './types';

describe('isFilterStrategy', () => {
  it.each(Object.values(FilterStrategy))('accepts %s', (strategy) => {
    expect(isFilterStrategy(strategy)).toBe(true);
  });

  it.each([['GROUPED'], ['Grouped'], [''], ['optimised'], [null], [undefined], [0], [{}]])(
    'rejects %o, which a hand-edited persisted blob could carry',
    (value) => {
      expect(isFilterStrategy(value)).toBe(false);
    }
  );

  it('accepts the default it is paired with', () => {
    expect(isFilterStrategy(DEFAULT_FILTER_STRATEGY)).toBe(true);
  });
});
