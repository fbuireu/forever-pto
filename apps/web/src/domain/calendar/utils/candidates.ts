import type { HolidayDTO } from '@application/dto/holiday/types';
import type { Bridge } from '../types';
import { findBridges, getAvailableWorkdays } from './helpers';

export interface PlanningCandidates {
  availableWorkdays: Date[];
  bridges: Bridge[];
}

interface FindPlanningCandidatesParams {
  holidays: HolidayDTO[];
  months: Date[];
  allowPastDays: boolean;
  removedDays?: Date[];
}

export const findPlanningCandidates = ({
  holidays,
  months,
  allowPastDays,
  removedDays,
}: FindPlanningCandidatesParams): PlanningCandidates => {
  const availableWorkdays = getAvailableWorkdays({ months, holidays, allowPastDays, removedDays });

  return { availableWorkdays, bridges: findBridges({ availableWorkdays, holidays }) };
};
