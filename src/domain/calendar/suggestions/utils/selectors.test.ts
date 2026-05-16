import type { Bridge } from '@domain/calendar/types';
import { FilterStrategy } from '@domain/calendar/types';
import { describe, expect, it } from 'vitest';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from './selectors';

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeBridge = (ptoDays: Date[], effectiveDays: number): Bridge => ({
  startDate: ptoDays[0],
  endDate: ptoDays[ptoDays.length - 1],
  ptoDaysNeeded: ptoDays.length,
  effectiveDays,
  efficiency: effectiveDays / ptoDays.length,
  ptoDays,
});

// bridgeA: Jan 6 (Mon), 1 PTO day, efficiency=3
const bridgeA = makeBridge([makeDate(2025, 1, 6)], 3);
// bridgeB: Jan 9-10 (Thu+Fri), 2 PTO days, efficiency=2
const bridgeB = makeBridge([makeDate(2025, 1, 9), makeDate(2025, 1, 10)], 4);
// bridgeC: Jan 7 (Tue), 1 PTO day, efficiency=3, no conflict with A
const bridgeC = makeBridge([makeDate(2025, 1, 7)], 3);

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

  it('returns days sorted chronologically', () => {
    const result = selectOptimalDaysFromBridges({ bridges: [bridgeC, bridgeA], targetPtoDays: 2 });
    for (let i = 1; i < result.days.length; i++) {
      expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
    }
  });
});
