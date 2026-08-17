import { Temporal } from 'temporal-polyfill';

const DAY_PREFIX_LENGTH = 10;

export const fromUpstreamCalendarDay = (value: string): Date => {
  const plainDate = Temporal.PlainDate.from(value.slice(0, DAY_PREFIX_LENGTH));
  return new Date(plainDate.year, plainDate.month - 1, plainDate.day);
};

export const fromStoredInstant = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));
