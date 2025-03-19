import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatFullDate (date: Date) {
  return format(date, "dd MMMM yyyy", { locale: es });
};

export function getWeekday (date: Date) {
  return format(date, "EEEE", { locale: es });
};