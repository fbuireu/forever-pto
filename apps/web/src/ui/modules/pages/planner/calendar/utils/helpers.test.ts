import { describe, expect, it } from 'vitest';
import { getDayClassNames, MODIFIERS_CLASS_NAMES } from './helpers';

const MONTH = new Date(2025, 0, 1);
const DAY = new Date(2025, 0, 15);

const always = () => true;
const never = () => false;

const classesFor = (overrides: Partial<Parameters<typeof getDayClassNames>[0]> = {}) =>
  getDayClassNames({
    date: DAY,
    month: MONTH,
    selectedDates: [],
    showOutsideDays: true,
    today: null,
    modifiers: {},
    ...overrides,
  });

const has = (classes: string, name: keyof typeof MODIFIERS_CLASS_NAMES) =>
  classes.includes(MODIFIERS_CLASS_NAMES[name]);

describe('getDayClassNames precedence', () => {
  it('paints a Holiday when nothing outranks it', () => {
    const classes = classesFor({ modifiers: { holiday: always } });
    expect(has(classes, 'holiday')).toBe(true);
  });

  it('lets today suppress every other modifier, Holiday included', () => {
    const classes = classesFor({ modifiers: { today: always, holiday: always, suggested: always } });
    expect(has(classes, 'today')).toBe(true);
    expect(has(classes, 'holiday')).toBe(false);
    expect(has(classes, 'suggested')).toBe(false);
  });

  it('lets a selected day suppress the modifiers and win outright', () => {
    const classes = classesFor({
      selectedDates: [DAY],
      modifiers: { holiday: always, suggested: always, manuallySelected: always },
    });
    expect(has(classes, 'selected')).toBe(true);
    expect(has(classes, 'holiday')).toBe(false);
    expect(has(classes, 'suggested')).toBe(false);
    expect(has(classes, 'manuallySelected')).toBe(false);
  });

  it('stacks the non-range modifiers that match, since none of them outranks another', () => {
    const classes = classesFor({ modifiers: { weekend: always, holiday: always } });
    expect(has(classes, 'weekend')).toBe(true);
    expect(has(classes, 'holiday')).toBe(true);
  });

  it('lets a selected day suppress inRange but not rangeStart, which are applied by separate guards', () => {
    const unselected = classesFor({ modifiers: { inRange: always, rangeStart: always } });
    expect(has(unselected, 'inRange')).toBe(true);
    expect(has(unselected, 'rangeStart')).toBe(true);

    const selected = classesFor({ selectedDates: [DAY], modifiers: { inRange: always, rangeStart: always } });
    expect(has(selected, 'inRange')).toBe(false);
    expect(has(selected, 'rangeStart')).toBe(true);
  });

  it('applies no range class when no range modifier matches', () => {
    const classes = classesFor({ modifiers: { inRange: never, rangeStart: never, rangeEnd: never } });
    expect(has(classes, 'inRange')).toBe(false);
    expect(has(classes, 'rangeStart')).toBe(false);
  });

  it('drops every state class when the day is disabled', () => {
    const classes = classesFor({
      disabled: true,
      selectedDates: [DAY],
      modifiers: { today: always, holiday: always, inRange: always },
    });
    expect(has(classes, 'today')).toBe(false);
    expect(has(classes, 'holiday')).toBe(false);
    expect(has(classes, 'selected')).toBe(false);
    expect(has(classes, 'inRange')).toBe(false);
    expect(classes).toContain('cursor-not-allowed');
  });
});

describe('getDayClassNames month and past-day handling', () => {
  it('fades a day outside the month when outside days are shown', () => {
    const classes = classesFor({ date: new Date(2025, 1, 3), showOutsideDays: true });
    expect(classes).toContain('opacity-50');
  });

  it('hides it entirely when they are not', () => {
    const classes = classesFor({ date: new Date(2025, 1, 3), showOutsideDays: false });
    expect(classes).toContain('invisible');
  });

  it('fades a past day only when the past is excluded', () => {
    const today = new Date(2025, 0, 20);
    expect(classesFor({ today, allowPastDays: false })).toContain('opacity-60');
    expect(classesFor({ today, allowPastDays: true })).not.toContain('opacity-60');
  });

  it('offers the hover lift only to a day that carries no state of its own', () => {
    expect(classesFor()).toContain('hit-area-stable');
    expect(classesFor({ selectedDates: [DAY] })).not.toContain('hit-area-stable');
    expect(classesFor({ modifiers: { today: always } })).not.toContain('hit-area-stable');
  });
});
