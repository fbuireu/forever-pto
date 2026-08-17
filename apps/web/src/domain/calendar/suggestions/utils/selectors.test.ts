import type { Bridge } from '@domain/calendar/types';
import { FilterStrategy } from '@domain/calendar/types';
import { clearDateKeyCache, clearHolidayCache } from '@domain/calendar/utils/cache';
import { beforeEach, describe, expect, it } from 'vitest';
import { selectBridgesForStrategy } from './selectors';

beforeEach(() => {
  clearDateKeyCache();
  clearHolidayCache();
});

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeBridge = (ptoDays: Date[], effectiveDays: number): Bridge => ({
  startDate: ptoDays[0],
  endDate: ptoDays[ptoDays.length - 1],
  ptoDaysNeeded: ptoDays.length,
  effectiveDays,
  efficiency: effectiveDays / ptoDays.length,
  ptoDays,
});

const bridgeA = makeBridge([makeDate(2025, 1, 6)], 3);
const bridgeB = makeBridge([makeDate(2025, 1, 9), makeDate(2025, 1, 10)], 4);
const bridgeC = makeBridge([makeDate(2025, 1, 7)], 3);
const bridgeShortHigh = makeBridge([makeDate(2025, 1, 13)], 2.7);
const bridgeLong = makeBridge([makeDate(2025, 1, 20), makeDate(2025, 1, 21), makeDate(2025, 1, 22)], 8);
const bridgeShortTop = makeBridge([makeDate(2025, 1, 13)], 3);

describe('selectBridgesForStrategy', () => {
  it('returns empty result for empty bridges', () => {
    const result = selectBridgesForStrategy({ bridges: [], targetPtoDays: 5, strategy: FilterStrategy.GROUPED });
    expect(result.days).toHaveLength(0);
    expect(result.bridges).toHaveLength(0);
  });

  it('GROUPED prefers multi-day bridges over single-day ones', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeA, bridgeB, bridgeC],
      targetPtoDays: 2,
      strategy: FilterStrategy.GROUPED,
    });
    expect(result.bridges).toContain(bridgeB);
    expect(result.days.some((day) => day.toDateString() === makeDate(2025, 1, 9).toDateString())).toBe(true);
  });

  it('OPTIMIZED prefers high-efficiency bridges', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeA, bridgeB, bridgeC],
      targetPtoDays: 2,
      strategy: FilterStrategy.OPTIMIZED,
    });
    expect(result.bridges).toContain(bridgeA);
    expect(result.bridges).toContain(bridgeC);
    expect(result.bridges).not.toContain(bridgeB);
  });

  it('OPTIMIZED breaks a near-tie in efficiency by preferring the longer stretch off', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeShortHigh, bridgeLong],
      targetPtoDays: 3,
      strategy: FilterStrategy.OPTIMIZED,
    });
    expect(result.bridges).toContain(bridgeLong);
    expect(result.bridges).not.toContain(bridgeShortHigh);
  });

  it('OPTIMIZED still ranks by raw efficiency when the gap exceeds the tie threshold', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeShortTop, bridgeLong],
      targetPtoDays: 3,
      strategy: FilterStrategy.OPTIMIZED,
    });
    expect(result.bridges).toContain(bridgeShortTop);
    expect(result.bridges).not.toContain(bridgeLong);
  });

  it('admits bridges down to the strategy-agnostic minimum efficiency — OPTIMIZED has no higher floor', () => {
    const optimized = selectBridgesForStrategy({
      bridges: [bridgeB],
      targetPtoDays: 2,
      strategy: FilterStrategy.OPTIMIZED,
    });
    const balanced = selectBridgesForStrategy({
      bridges: [bridgeB],
      targetPtoDays: 2,
      strategy: FilterStrategy.BALANCED,
    });
    expect(bridgeB.efficiency).toBe(2);
    expect(optimized.days).toHaveLength(2);
    expect(balanced.days).toHaveLength(2);
  });

  it('presorted keeps the caller ordering instead of re-sorting', () => {
    const bridges = [bridgeA, bridgeC, bridgeB];
    const resorted = selectBridgesForStrategy({ bridges, targetPtoDays: 2, strategy: FilterStrategy.GROUPED });
    const kept = selectBridgesForStrategy({
      bridges,
      targetPtoDays: 2,
      strategy: FilterStrategy.GROUPED,
      presorted: true,
    });
    expect(resorted.bridges).toEqual([bridgeB]);
    expect(kept.bridges).toEqual([bridgeA, bridgeC]);
  });

  it('does not exceed targetPtoDays', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeA, bridgeB, bridgeC],
      targetPtoDays: 1,
      strategy: FilterStrategy.OPTIMIZED,
    });
    const total = result.bridges.reduce((sum, b) => sum + b.ptoDaysNeeded, 0);
    expect(total).toBeLessThanOrEqual(1);
  });

  it('does not select conflicting bridges', () => {
    const conflicting = makeBridge([makeDate(2025, 1, 6), makeDate(2025, 1, 7)], 5);
    const result = selectBridgesForStrategy({
      bridges: [bridgeA, conflicting],
      targetPtoDays: 3,
      strategy: FilterStrategy.GROUPED,
    });
    const jan6Count = result.days.filter((day) => day.toDateString() === new Date(2025, 0, 6).toDateString()).length;
    expect(jan6Count).toBeLessThanOrEqual(1);
  });

  it('returns days sorted chronologically', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeC, bridgeA],
      targetPtoDays: 2,
      strategy: FilterStrategy.OPTIMIZED,
    });
    for (let i = 1; i < result.days.length; i++) {
      expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
    }
  });
});

describe('selectBridgesForStrategy, BALANCED', () => {
  it('returns empty result for empty bridges', () => {
    const result = selectBridgesForStrategy({ bridges: [], targetPtoDays: 5, strategy: FilterStrategy.BALANCED });
    expect(result.days).toHaveLength(0);
    expect(result.bridges).toHaveLength(0);
  });

  it('selects bridges without exceeding targetPtoDays', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeA, bridgeB, bridgeC],
      targetPtoDays: 2,
      strategy: FilterStrategy.BALANCED,
    });
    const total = result.bridges.reduce((sum, b) => sum + b.ptoDaysNeeded, 0);
    expect(total).toBeLessThanOrEqual(2);
  });

  it('does not select conflicting bridges', () => {
    const overlap = makeBridge([makeDate(2025, 1, 6)], 3);
    const result = selectBridgesForStrategy({
      bridges: [bridgeA, overlap],
      targetPtoDays: 2,
      strategy: FilterStrategy.BALANCED,
    });
    const jan6Count = result.days.filter((day) => day.toDateString() === new Date(2025, 0, 6).toDateString()).length;
    expect(jan6Count).toBe(1);
  });

  it('presorted keeps the caller ordering instead of re-scoring', () => {
    const bridges = [bridgeB, bridgeA];
    const rescored = selectBridgesForStrategy({ bridges, targetPtoDays: 2, strategy: FilterStrategy.BALANCED });
    const kept = selectBridgesForStrategy({
      bridges,
      targetPtoDays: 2,
      presorted: true,
      strategy: FilterStrategy.BALANCED,
    });
    expect(rescored.days).toEqual(bridgeA.ptoDays);
    expect(kept.days).toEqual(bridgeB.ptoDays);
  });

  it('leaves the budget unspent when every remaining single-day bridge is already taken', () => {
    const highValue = makeBridge([makeDate(2025, 1, 20), makeDate(2025, 1, 21), makeDate(2025, 1, 22)], 9);
    const conflicting = makeBridge([makeDate(2025, 1, 20)], 3);
    const result = selectBridgesForStrategy({
      bridges: [highValue, conflicting],
      targetPtoDays: 4,
      strategy: FilterStrategy.BALANCED,
    });
    expect(result.bridges).toHaveLength(1);
    expect(result.days).toEqual(highValue.ptoDays);
  });

  it('returns days sorted chronologically', () => {
    const result = selectBridgesForStrategy({
      bridges: [bridgeC, bridgeA],
      targetPtoDays: 2,
      strategy: FilterStrategy.BALANCED,
    });
    for (let i = 1; i < result.days.length; i++) {
      expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
    }
  });
});

describe('the BALANCED ordering, high-value first', () => {
  it('takes the high-value block before the crowd of cheap bridges that would exhaust the budget', () => {
    const highValueThreeDaysNineEffective = makeBridge(
      [makeDate(2025, 4, 14), makeDate(2025, 4, 15), makeDate(2025, 4, 16)],
      9
    );
    const cheapOne = makeBridge([makeDate(2025, 2, 3)], 3);
    const cheapTwo = makeBridge([makeDate(2025, 3, 3)], 3);
    const cheapThree = makeBridge([makeDate(2025, 5, 5)], 3);

    const { bridges: selected } = selectBridgesForStrategy({
      bridges: [cheapOne, cheapTwo, cheapThree, highValueThreeDaysNineEffective],
      targetPtoDays: 3,
      strategy: FilterStrategy.BALANCED,
    });

    expect(selected).toContain(highValueThreeDaysNineEffective);
    expect(selected).toHaveLength(1);
  });

  it('rescues a long block the score alone would have lost to three cheaper bridges', () => {
    const block = makeBridge([makeDate(2025, 4, 14), makeDate(2025, 4, 15), makeDate(2025, 4, 16)], 9);
    const cheap = [makeDate(2025, 2, 3), makeDate(2025, 3, 3), makeDate(2025, 5, 5)].map((day) => makeBridge([day], 6));

    const { bridges: selected } = selectBridgesForStrategy({
      bridges: [...cheap, block],
      targetPtoDays: 3,
      strategy: FilterStrategy.BALANCED,
    });

    expect(selected).toEqual([block]);
  });
});

describe('BALANCED scoring formula', () => {
  const orderOf = (bridges: Bridge[]) =>
    selectBridgesForStrategy({ bridges, targetPtoDays: 99, strategy: FilterStrategy.BALANCED }).bridges.map(
      (bridge) => bridge.effectiveDays
    );

  it('divides the span by ten so a long low-efficiency bridge cannot outscore a short efficient one', () => {
    const efficient = makeBridge([makeDate(2025, 2, 3)], 4);
    const long = makeBridge([makeDate(2025, 3, 3), makeDate(2025, 3, 4), makeDate(2025, 3, 5)], 8);

    expect(orderOf([long, efficient])).toEqual([4, 8]);
  });

  it('weights efficiency at 0.6 over span at 0.4, so 5.40 beats 5.04 where a swap would make it 4.35 against 4.56', () => {
    const sharper = makeBridge([makeDate(2025, 2, 3), makeDate(2025, 2, 4), makeDate(2025, 2, 5)], 15);
    const broader = makeBridge(
      [
        makeDate(2025, 4, 7),
        makeDate(2025, 4, 8),
        makeDate(2025, 4, 9),
        makeDate(2025, 4, 10),
        makeDate(2025, 4, 11),
        makeDate(2025, 4, 14),
      ],
      24
    );

    expect(orderOf([broader, sharper])).toEqual([15, 24]);
  });

  it('bonuses a long 2.4-efficiency bridge the high-value pass skips, lifting 1.92 to 2.88 over a 2.56 rival', () => {
    const longButOrdinary = makeBridge(
      [makeDate(2025, 5, 5), makeDate(2025, 5, 6), makeDate(2025, 5, 7), makeDate(2025, 5, 8), makeDate(2025, 5, 9)],
      12
    );
    const sharpAndSmall = makeBridge([makeDate(2025, 6, 2)], 4);

    expect(orderOf([sharpAndSmall, longButOrdinary])).toEqual([12, 4]);
  });
});
