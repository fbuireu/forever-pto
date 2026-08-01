import type { Bridge } from '@domain/calendar/types';
import { FilterStrategy } from '@domain/calendar/types';
import { clearDateKeyCache, clearHolidayCache } from '@domain/calendar/utils/cache';
import { beforeEach, describe, expect, it } from 'vitest';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from './selectors';

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

  it('BALANCED delegates to selectOptimalDaysFromBridges', () => {
    const balanced = selectBridgesForStrategy({
      bridges: [bridgeA, bridgeB],
      targetPtoDays: 2,
      strategy: FilterStrategy.BALANCED,
    });
    const optimal = selectOptimalDaysFromBridges({ bridges: [bridgeA, bridgeB], targetPtoDays: 2 });
    expect(balanced.days.map((day) => day.toDateString())).toEqual(optimal.days.map((day) => day.toDateString()));
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

describe('selectOptimalDaysFromBridges', () => {
  it('returns empty result for empty bridges', () => {
    const result = selectOptimalDaysFromBridges({ bridges: [], targetPtoDays: 5 });
    expect(result.days).toHaveLength(0);
    expect(result.totalEffectiveDays).toBe(0);
  });

  it('selects bridges without exceeding targetPtoDays', () => {
    const result = selectOptimalDaysFromBridges({
      bridges: [bridgeA, bridgeB, bridgeC],
      targetPtoDays: 2,
    });
    const total = result.bridges.reduce((sum, b) => sum + b.ptoDaysNeeded, 0);
    expect(total).toBeLessThanOrEqual(2);
  });

  it('accumulates totalEffectiveDays from selected bridges', () => {
    const result = selectOptimalDaysFromBridges({ bridges: [bridgeA], targetPtoDays: 1 });
    expect(result.totalEffectiveDays).toBe(3);
  });

  it('does not select conflicting bridges', () => {
    const overlap = makeBridge([makeDate(2025, 1, 6)], 3);
    const result = selectOptimalDaysFromBridges({ bridges: [bridgeA, overlap], targetPtoDays: 2 });
    const jan6Count = result.days.filter((day) => day.toDateString() === new Date(2025, 0, 6).toDateString()).length;
    expect(jan6Count).toBe(1);
  });

  it('presorted keeps the caller ordering instead of re-scoring', () => {
    const bridges = [bridgeB, bridgeA];
    const rescored = selectOptimalDaysFromBridges({ bridges, targetPtoDays: 2 });
    const kept = selectOptimalDaysFromBridges({ bridges, targetPtoDays: 2, presorted: true });
    expect(rescored.days).toEqual(bridgeA.ptoDays);
    expect(kept.days).toEqual(bridgeB.ptoDays);
  });

  it('leaves the budget unspent when every remaining single-day bridge is already taken', () => {
    const highValue = makeBridge([makeDate(2025, 1, 20), makeDate(2025, 1, 21), makeDate(2025, 1, 22)], 9);
    const conflicting = makeBridge([makeDate(2025, 1, 20)], 3);
    const result = selectOptimalDaysFromBridges({ bridges: [highValue, conflicting], targetPtoDays: 4 });
    expect(result.bridges).toHaveLength(1);
    expect(result.days).toEqual(highValue.ptoDays);
  });

  it('returns days sorted chronologically', () => {
    const result = selectOptimalDaysFromBridges({ bridges: [bridgeC, bridgeA], targetPtoDays: 2 });
    for (let i = 1; i < result.days.length; i++) {
      expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
    }
  });
});
