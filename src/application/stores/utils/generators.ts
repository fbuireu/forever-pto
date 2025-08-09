import { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, eachDayOfInterval, endOfMonth, isSameDay, isWeekend, startOfMonth } from 'date-fns';
import { ensureDate } from './helpers';

export interface SuggestionBlock {
  id: string;
  days: Date[];
  effectiveDays: number;
  ptoDays: number;
  score: number;
}

interface BlockOpportunity {
  days: Date[];
  effectiveDays: number;
  score: number;
}

interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
}

export function generateOptimalSuggestions(params: GenerateSuggestionsParams) {
  const { ptoDays, holidays, allowPastDays, months } = params;

  if (ptoDays <= 0) {
    return { blocks: [], alternatives: {} };
  }

  // 1. Obtener todos los días laborables disponibles
  const availableWorkdays = getAvailableWorkdays({
    months,
    holidays,
    allowPastDays,
  });

  // 2. Generar todas las oportunidades de bloques posibles
  const opportunities = generateBlockOpportunities({
    availableWorkdays,
    holidays,
    maxBlockSize: Math.min(5, ptoDays), // Máximo 5 días por bloque
  });

  // 3. Seleccionar la mejor combinación de bloques
  const selectedBlocks = selectOptimalBlocks({
    opportunities,
    targetDays: ptoDays,
  });

  // 4. Generar alternativas para cada bloque
  const alternatives = generateAlternatives({
    selectedBlocks,
    allOpportunities: opportunities,
  });

  return {
    blocks: selectedBlocks,
    alternatives,
  };
}

function getAvailableWorkdays({
  months,
  holidays,
  allowPastDays,
}: {
  months: Date[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const workdays: Date[] = [];

  for (const month of months) {
    const days = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month),
    });

    for (const day of days) {
      // Filtrar días pasados si no están permitidos
      if (!allowPastDays && day < today) continue;

      // Filtrar fines de semana
      if (isWeekend(day)) continue;

      // Filtrar festivos - asegurar que holiday.date sea Date
      const isHoliday = holidays.some((h) => isSameDay(ensureDate(h.date), day));
      if (isHoliday) continue;

      workdays.push(day);
    }
  }

  return workdays;
}
function generateBlockOpportunities({
  availableWorkdays,
  holidays,
  maxBlockSize,
}: {
  availableWorkdays: Date[];
  holidays: HolidayDTO[];
  maxBlockSize: number;
}) {
  const opportunities: BlockOpportunity[] = [];

  for (let i = 0; i < availableWorkdays.length; i++) {
    for (let size = 1; size <= maxBlockSize; size++) {
      const block = tryCreateBlock({
        startIndex: i,
        size,
        workdays: availableWorkdays,
        holidays,
      });

      if (block) {
        opportunities.push(block);
      }
    }
  }

  // Ordenar por score descendente
  return opportunities.sort((a, b) => b.score - a.score);
}

function tryCreateBlock({
  startIndex,
  size,
  workdays,
  holidays,
}: {
  startIndex: number;
  size: number;
  workdays: Date[];
  holidays: HolidayDTO[];
}) {
  if (startIndex + size > workdays.length) return null;

  const blockDays: Date[] = [];

  // Recolectar los días del bloque
  for (let i = 0; i < size; i++) {
    const currentDay = workdays[startIndex + i];

    if (i > 0) {
      const prevDay = blockDays[i - 1];
      const daysBetween = differenceInDays(currentDay, prevDay);

      // Si hay más de 4 días entre días laborables (ej: viernes a lunes siguiente + festivos),
      // no es un bloque continuo válido
      if (daysBetween > 4) return null;
    }

    blockDays.push(currentDay);
  }

  // Calcular días efectivos y score
  const effectiveDays = calculateEffectiveDays(blockDays, holidays);
  const score = calculateBlockScore({
    blockDays,
    effectiveDays,
    holidays,
  });

  return {
    days: blockDays,
    effectiveDays,
    score,
  };
}

function calculateEffectiveDays(ptoDays: Date[], holidays: HolidayDTO[]): number {
  if (ptoDays.length === 0) return 0;

  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  // Contar todos los días entre el primero y el último (incluyendo fines de semana y festivos)
  let effectiveDays = 0;
  let currentDate = new Date(firstDay);

  while (currentDate <= lastDay) {
    effectiveDays++;
    currentDate = addDays(currentDate, 1);
  }

  // Si el bloque conecta con un fin de semana al inicio o al final, incluirlo
  const dayBefore = addDays(firstDay, -1);
  const dayAfter = addDays(lastDay, 1);

  // Verificar si hay fin de semana o festivo justo antes
  if (isWeekend(dayBefore) || holidays.some((h) => isSameDay(new Date(h.date), dayBefore))) {
    // Contar hacia atrás hasta el último día laboral
    let checkDay = addDays(dayBefore, -1);
    while (isWeekend(checkDay) || holidays.some((h) => isSameDay(new Date(h.date), checkDay))) {
      effectiveDays++;
      checkDay = addDays(checkDay, -1);
    }
    effectiveDays++; // Contar el día festivo/fin de semana inmediato
  }

  // Verificar si hay fin de semana o festivo justo después
  if (isWeekend(dayAfter) || holidays.some((h) => isSameDay(new Date(h.date), dayAfter))) {
    // Contar hacia adelante hasta el próximo día laboral
    let checkDay = dayAfter;
    while (isWeekend(checkDay) || holidays.some((h) => isSameDay(new Date(h.date), checkDay))) {
      effectiveDays++;
      checkDay = addDays(checkDay, 1);
    }
  }

  return effectiveDays;
}

function calculateBlockScore({
  blockDays,
  effectiveDays,
  holidays,
}: {
  blockDays: Date[];
  effectiveDays: number;
  holidays: HolidayDTO[];
}): number {
  const ptoDays = blockDays.length;
  const efficiency = effectiveDays / ptoDays;

  // Score base en función de la eficiencia
  let score = efficiency * 10;

  // Bonus por bloques largos (favorece vacaciones más largas)
  if (ptoDays >= 5) {
    score *= 1.5;
  } else if (ptoDays >= 3) {
    score *= 1.2;
  }

  // Bonus por aprovechar festivos adyacentes
  const firstDay = blockDays[0];
  const lastDay = blockDays[blockDays.length - 1];
  const hasAdjacentHoliday = holidays.some((h) => {
    const holidayDate = new Date(h.date);
    const dayBefore = addDays(firstDay, -1);
    const dayAfter = addDays(lastDay, 1);
    return isSameDay(holidayDate, dayBefore) || isSameDay(holidayDate, dayAfter);
  });

  if (hasAdjacentHoliday) {
    score *= 1.3;
  }

  // Bonus por crear puentes largos
  if (effectiveDays >= 9) {
    score *= 1.4;
  } else if (effectiveDays >= 7) {
    score *= 1.2;
  }

  // Penalización leve para días únicos (favorece agrupar)
  if (ptoDays === 1 && efficiency < 3) {
    score *= 0.7;
  }

  return score;
}

function selectOptimalBlocks({
  opportunities,
  targetDays,
}: {
  opportunities: BlockOpportunity[];
  targetDays: number;
}): SuggestionBlock[] {
  const selected: BlockOpportunity[] = [];
  const usedDays = new Set<string>();
  let remainingDays = targetDays;

  // Primero, intentar seleccionar bloques de alta eficiencia
  for (const opportunity of opportunities) {
    if (remainingDays <= 0) break;
    if (opportunity.days.length > remainingDays) continue;

    const efficiency = opportunity.effectiveDays / opportunity.days.length;

    // Solo considerar bloques con buena eficiencia (ratio > 2.5)
    if (efficiency < 2.5 && opportunity.days.length === 1) continue;

    // Verificar que no haya conflicto con días ya seleccionados
    const hasConflict = opportunity.days.some((day) => usedDays.has(day.toISOString()));

    if (!hasConflict) {
      selected.push(opportunity);
      opportunity.days.forEach((day) => usedDays.add(day.toISOString()));
      remainingDays -= opportunity.days.length;
    }
  }

  // Si quedan días, intentar llenar con bloques más pequeños
  if (remainingDays > 0) {
    for (const opportunity of opportunities) {
      if (remainingDays <= 0) break;
      if (opportunity.days.length > remainingDays) continue;

      const hasConflict = opportunity.days.some((day) => usedDays.has(day.toISOString()));

      if (!hasConflict) {
        selected.push(opportunity);
        opportunity.days.forEach((day) => usedDays.add(day.toISOString()));
        remainingDays -= opportunity.days.length;
      }
    }
  }

  // Convertir a formato final con IDs únicos
  return selected.map((block, index) => ({
    id: `block_${index + 1}`,
    days: block.days,
    effectiveDays: block.effectiveDays,
    ptoDays: block.days.length,
    score: block.score,
  }));
}

function generateAlternatives({
  selectedBlocks,
  allOpportunities,
}: {
  selectedBlocks: SuggestionBlock[];
  allOpportunities: BlockOpportunity[];
}): Record<string, SuggestionBlock[]> {
  const alternatives: Record<string, SuggestionBlock[]> = {};

  // Set de días ya usados en bloques seleccionados
  const usedDays = new Set<string>();
  selectedBlocks.forEach((block) => {
    block.days.forEach((day) => usedDays.add(day.toISOString()));
  });

  for (const block of selectedBlocks) {
    // Buscar bloques alternativos con características similares
    const similarBlocks = allOpportunities.filter((opp) => {
      // Debe tener la misma cantidad de días efectivos (tolerancia de ±1)
      const effectiveDiff = Math.abs(opp.effectiveDays - block.effectiveDays);
      if (effectiveDiff > 1) return false;

      // Debe tener un tamaño similar (tolerancia de ±1 día)
      const sizeDiff = Math.abs(opp.days.length - block.ptoDays);
      if (sizeDiff > 1) return false;

      // No debe ser el mismo bloque
      const isSameBlock =
        opp.days.length === block.days.length && opp.days.every((day, i) => isSameDay(day, block.days[i]));
      if (isSameBlock) return false;

      // No debe tener días que ya estén siendo usados
      const hasConflict = opp.days.some((day) => usedDays.has(day.toISOString()));

      return !hasConflict;
    });

    // Ordenar por score y tomar las mejores 3-5 alternativas
    alternatives[block.id] = similarBlocks
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((alt, index) => ({
        id: `${block.id}_alt_${index + 1}`,
        days: alt.days,
        effectiveDays: alt.effectiveDays,
        ptoDays: alt.days.length,
        score: alt.score,
      }));
  }

  return alternatives;
}
