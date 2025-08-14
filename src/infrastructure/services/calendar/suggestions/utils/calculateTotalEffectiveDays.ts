import type { HolidayDTO } from '@application/dto/holiday/types';

// Cache global para holiday sets (si se usa el mismo array de holidays múltiples veces)
const holidaySetCache = new WeakMap<HolidayDTO[], Set<string>>();

export function calculateTotalEffectiveDays(ptoDays: Date[], holidays: HolidayDTO[]): number {
  if (ptoDays.length === 0) return 0;

  // Obtener o crear holiday set desde cache
  let holidaySet = holidaySetCache.get(holidays);
  if (!holidaySet) {
    holidaySet = createHolidaySet(holidays);
    holidaySetCache.set(holidays, holidaySet);
  }

  // Sort days by timestamp (más eficiente que comparación de fechas)
  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());

  // Group consecutive days into ranges
  const ranges: { start: Date; end: Date }[] = [];
  let currentRangeStart = sortedDays[0];
  let currentRangeEnd = sortedDays[0];

  for (let i = 1; i < sortedDays.length; i++) {
    // Cálculo directo de diferencia en días usando timestamps
    const dayDiff = Math.floor((sortedDays[i].getTime() - currentRangeEnd.getTime()) / 86400000);

    if (dayDiff <= 4) {
      currentRangeEnd = sortedDays[i];
    } else {
      ranges.push({ start: currentRangeStart, end: currentRangeEnd });
      currentRangeStart = sortedDays[i];
      currentRangeEnd = sortedDays[i];
    }
  }
  ranges.push({ start: currentRangeStart, end: currentRangeEnd });

  // Calculate effective days for all ranges
  let totalEffective = 0;

  ranges.forEach((range) => {
    // Count days in range (usando timestamps)
    const rangeDays = Math.floor((range.end.getTime() - range.start.getTime()) / 86400000) + 1;
    totalEffective += rangeDays;

    // Add free days before the range
    let before = new Date(range.start);
    before.setDate(before.getDate() - 1);
    while (isFreeDay(before, holidaySet)) {
      totalEffective++;
      before.setDate(before.getDate() - 1);
      // Límite de seguridad para evitar loops infinitos
      if (totalEffective > 365) break;
    }

    // Add free days after the range
    let after = new Date(range.end);
    after.setDate(after.getDate() + 1);
    while (isFreeDay(after, holidaySet)) {
      totalEffective++;
      after.setDate(after.getDate() + 1);
      // Límite de seguridad
      if (totalEffective > 365) break;
    }
  });

  return totalEffective;
}

// Función helper optimizada para crear set de holidays
function createHolidaySet(holidays: HolidayDTO[]): Set<string> {
  const holidaySet = new Set<string>();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    // Create YYYY-MM-DD key for O(1) lookup
    const key = getDateKey(date);
    holidaySet.add(key);
  }
  return holidaySet;
}

// Función helper para generar clave de fecha
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Función helper optimizada para verificar si es día libre
function isFreeDay(date: Date, holidaySet: Set<string>): boolean {
  const dayOfWeek = date.getDay();
  // Weekend check (0 = Sunday, 6 = Saturday)
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;

  // Holiday check usando set O(1)
  return holidaySet.has(getDateKey(date));
}
