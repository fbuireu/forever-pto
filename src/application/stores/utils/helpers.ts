import { startOfDay } from "date-fns";

export const getDateKey = (date: Date): string => startOfDay(date).toISOString().split('T')[0];
