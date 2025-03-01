'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import {
  addDays,
  addMonths,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDate,
  getMonth,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Holiday } from '@/lib/holidays';

const MONTHS_TO_DISPLAY = 12;
const ALTERNATIVE_THRESHOLD = .75;
const MAX_BLOCK_SIZE = 5; // Máximo tamaño de bloque a considerar
const MAX_ALTERNATIVES = 5; // Límite de alternativas por bloque

// Interfaces for typing
interface DayInfo {
  date: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  isSelected: boolean;
  isFreeDay: boolean;
  month: number;
}

interface BlockOpportunity {
  startDay: Date;
  days: Date[];
  blockSize: number;
  daysBeforeBlock: number;
  daysAfterBlock: number;
  totalConsecutiveDays: number;
  score: number;
  month: number;
  effectiveDays: number; // Total effective days
}

interface CalendarListProps {
  country: string;
  region: string;
  year: number;
  availablePtoDays: number;
  allowPastDays: boolean;
  holidays: Holiday[];
}

export default function CalendarList({
  country,
  region,
  year,
  availablePtoDays,
  allowPastDays,
  holidays,
}: CalendarListProps) {
  // States
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [suggestedDays, setSuggestedDays] = useState<Date[]>([]);
  const [alternativeBlocks, setAlternativeBlocks] = useState<Record<string, BlockOpportunity[]>>({});
  const [dayToBlockIdMap, setDayToBlockIdMap] = useState<Record<string, string>>({});
  const [optimizationSummary, setOptimizationSummary] = useState('');
  const [effectiveDaysData, setEffectiveDaysData] = useState({ effective: 0, ratio: 0 });
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  console.log('CALCULO', isPending);
  // Process holidays to handle the new format (converting ISO string dates to Date objects)
  const processedHolidays = useMemo(() => {
    return holidays.map(holiday => ({
      ...holiday,
      date: holiday.date instanceof Date ? holiday.date : parseISO(holiday.date as unknown as string),
    })).filter(holiday => {
      // Filtrar por región: incluir festividades nacionales (location === null) y
      // festividades específicas de la región seleccionada
      if (holiday.location === null) {
        return true; // Incluir festividades nacionales
      }

      if (Array.isArray(holiday.location)) {
        const regionCode = `${country.toUpperCase()}-${region.toUpperCase()}`;
        return holiday.location.includes(regionCode);
      }

      return false;
    });
  }, [holidays, country, region]);

  // Memoizar el mapa de días festivos para búsquedas rápidas O(1)
  const holidaysMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    processedHolidays.forEach(holiday => {
      map.set(format(holiday.date, 'yyyy-MM-dd'), holiday);
    });
    return map;
  }, [processedHolidays]);

  // Generate months to display based on the year, including next January
  const monthsToShow = useMemo(() => {
    const start = startOfMonth(new Date(year, 0, 1));
    const months = Array.from({ length: MONTHS_TO_DISPLAY }, (_, i) => addMonths(start, i));

    // Add January of next year
    const nextJanuary = startOfMonth(new Date(year + 1, 0, 1));
    return [...months, nextJanuary];
  }, [year]);

  // Optimized function to check if a day is a holiday using the map (O(1) lookup)
  const isHoliday = useCallback((date: Date): boolean => {
    return holidaysMap.has(format(date, 'yyyy-MM-dd'));
  }, [holidaysMap]);

  // Function to get holiday name if exists - Updated for new format
  const getHolidayName = useCallback((date: Date): string | null => {
    const holiday = holidaysMap.get(format(date, 'yyyy-MM-dd'));
    return holiday ? holiday.name : null;
  }, [holidaysMap]);

  // Initialize with weekends and holidays
  useEffect(() => {
    // Este efecto solo se ejecuta cuando los parámetros clave cambian
    // No necesitamos optimizar aquí porque solo se ejecuta una vez por cambio de año
    const initialSelection: Date[] = [];

    // Add all weekends of the year
    monthsToShow.forEach(month => {
      const daysInMonth = eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      });

      daysInMonth.forEach(day => {
        if (isWeekend(day)) {
          initialSelection.push(day);
        }
      });
    });

    // Add holidays
    processedHolidays.forEach(holiday => {
      if (!initialSelection.some(day => isSameDay(day, holiday.date))) {
        initialSelection.push(holiday.date);
      }
    });

    setSelectedDays(initialSelection);
  }, [processedHolidays, monthsToShow, year, isHoliday]);

  // Calculate selected PTO days (only workdays)
  const selectedPtoDays = useMemo(() => {
    return selectedDays.filter(day =>
        !isWeekend(day) && !isHoliday(day),
    );
  }, [selectedDays, isHoliday]);

  // Memoizar el mapa de días libres para reutilizarlo
  const freeDaysBaseMap = useMemo(() => {
    const map = new Map<string, Date>();

    // Add weekends (pre-calculados)
    monthsToShow.forEach(month => {
      eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      }).forEach(day => {
        if (isWeekend(day)) {
          map.set(format(day, 'yyyy-MM-dd'), day);
        }
      });
    });

    // Add holidays (pre-calculados)
    processedHolidays.forEach(holiday => {
      map.set(format(holiday.date, 'yyyy-MM-dd'), holiday.date);
    });

    // Add selected PTO days
    selectedPtoDays.forEach(day => {
      map.set(format(day, 'yyyy-MM-dd'), day);
    });

    return map;
  }, [monthsToShow, processedHolidays, selectedPtoDays]);

  // Calculate effective days - optimized version
  const calculateEffectiveDays = useCallback((ptoDaysToAdd: Date[] = []): { effective: number; ratio: number } => {
    // Si no hay días PTO, no hay días efectivos
    if (selectedPtoDays.length === 0 && ptoDaysToAdd.length === 0) {
      return { effective: 0, ratio: 0 };
    }

    // Clonar el mapa base para no modificarlo
    const freeDaysMap = new Map(freeDaysBaseMap);

    // Añadir los días PTO adicionales
    ptoDaysToAdd.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      if (!freeDaysMap.has(dayKey)) {
        freeDaysMap.set(dayKey, day);
      }
    });

    // Identificar secuencias de días consecutivos
    const freeDays = Array.from(freeDaysMap.values())
        .sort((a, b) => a.getTime() - b.getTime());

    const sequences: Date[][] = [];
    let currentSequence: Date[] = [];

    for (let i = 0; i < freeDays.length; i++) {
      const currentDay = freeDays[i];

      if (currentSequence.length === 0) {
        currentSequence.push(currentDay);
      } else {
        const lastDay = currentSequence[currentSequence.length - 1];
        const expectedNextDay = addDays(lastDay, 1);

        if (isSameDay(currentDay, expectedNextDay)) {
          currentSequence.push(currentDay);
        } else {
          if (currentSequence.length >= 1) {
            sequences.push([...currentSequence]);
          }
          currentSequence = [currentDay];
        }
      }
    }

    // Añadir la última secuencia
    if (currentSequence.length >= 1) {
      sequences.push(currentSequence);
    }

    // Calcular días efectivos (secuencias que incluyen al menos un día PTO)
    let effectiveDays = 0;

    // Crear un conjunto de claves de días PTO para búsquedas más rápidas
    const ptoDayKeys = new Set([
      ...selectedPtoDays.map(day => format(day, 'yyyy-MM-dd')),
      ...ptoDaysToAdd.map(day => format(day, 'yyyy-MM-dd')),
    ]);

    sequences.forEach(sequence => {
      // Verificar si algún día de la secuencia es un día PTO
      const hasAnyPtoDay = sequence.some(day =>
          ptoDayKeys.has(format(day, 'yyyy-MM-dd')),
      );

      if (hasAnyPtoDay) {
        effectiveDays += sequence.length;
      }
    });

    // Calcular ratio
    const totalPtoDays = ptoDayKeys.size;
    const ratio = parseFloat((effectiveDays / totalPtoDays).toFixed(1));

    return { effective: effectiveDays, ratio };
  }, [freeDaysBaseMap, selectedPtoDays]);

  // Pre-calcular mapa de días del año para análisis rápido
  const yearMap = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map = new Map<string, DayInfo>();
    let allDays: Date[] = [];

    // Procesar todos los meses
    monthsToShow.forEach(month => {
      const daysInMonth = eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      });
      allDays.push(...daysInMonth);
    });

    // Filtrar días pasados si es necesario
    if (!allowPastDays) {
      allDays = allDays.filter(day => day >= today);
    }

    // Crear mapa de información de días
    allDays.forEach(day => {
      const isWeekendDay = isWeekend(day);
      const isHolidayDay = isHoliday(day);
      const isAlreadySelected = selectedDays.some(selectedDay =>
          !isWeekend(selectedDay) && !isHoliday(selectedDay) && isSameDay(selectedDay, day),
      );

      map.set(format(day, 'yyyy-MM-dd'), {
        date: day,
        isWeekend: isWeekendDay,
        isHoliday: isHolidayDay,
        isSelected: isAlreadySelected,
        isFreeDay: isWeekendDay || isHolidayDay || isAlreadySelected,
        month: getMonth(day),
      });
    });

    return { map, allDays };
  }, [monthsToShow, isHoliday, selectedDays, allowPastDays]);

  // Optimized function to find optimal gaps
  const findOptimalGaps = useCallback(() => {
    const remainingPtoDays = availablePtoDays - selectedPtoDays.length;
    if (remainingPtoDays <= 0) return {
      suggestedDays: [],
      alternativeBlocks: {},
      dayToBlockIdMap: {},
    };

    // Usar el mapa de días pre-calculado
    const { map: daysMap, allDays } = yearMap;

    // Filtrar solo días laborables disponibles
    const availableWorkdays = allDays.filter(day => {
      const dayInfo = daysMap.get(format(day, 'yyyy-MM-dd'));
      return dayInfo && !dayInfo.isFreeDay;
    });

    // STRATEGY: FIND OPTIMAL BLOCKS OF DAYS
    const blockOpportunities: BlockOpportunity[] = [];
    const blockCache = new Map<string, { blockDays: Date[], result: ReturnType<typeof calculateEffectiveDays> }>();

    // Evaluar bloques posibles
    for (let startDayIndex = 0; startDayIndex < availableWorkdays.length; startDayIndex++) {
      const startDay = availableWorkdays[startDayIndex];
      const startDayKey = format(startDay, 'yyyy-MM-dd');

      // Intentar bloques de diferentes tamaños
      for (let blockSize = 1; blockSize <= Math.min(MAX_BLOCK_SIZE, remainingPtoDays); blockSize++) {
        // Verificar si podemos formar un bloque válido
        let validBlock = true;
        const blockDays: Date[] = [startDay];
        const blockDayKeys = new Set([startDayKey]);

        // Añadir días siguientes al bloque
        for (let i = 1; i < blockSize; i++) {
          // Optimización: buscar directamente el siguiente día en workdays en lugar de calcular addDays
          if (startDayIndex + i >= availableWorkdays.length) {
            validBlock = false;
            break;
          }

          const nextDay = availableWorkdays[startDayIndex + i];
          const nextDayKey = format(nextDay, 'yyyy-MM-dd');

          // Verificar que los días son consecutivos
          if (differenceInDays(nextDay, blockDays[blockDays.length - 1]) !== 1) {
            validBlock = false;
            break;
          }

          blockDays.push(nextDay);
          blockDayKeys.add(nextDayKey);
        }

        if (!validBlock) continue;

        // Generar una clave única para este bloque de días
        const blockCacheKey = Array.from(blockDayKeys).sort().join('|');

        // Usar caché para días efectivos si ya lo calculamos antes
        let effectiveResult;
        if (blockCache.has(blockCacheKey)) {
          effectiveResult = blockCache.get(blockCacheKey)!.result;
        } else {
          effectiveResult = calculateEffectiveDays(blockDays);
          blockCache.set(blockCacheKey, { blockDays, result: effectiveResult });
        }

        // Calcular días antes y después del bloque
        // Optimización: calculamos esto solo una vez por bloque, no para cada día
        let daysBeforeBlock = 0;
        for (let i = 1; i <= 7; i++) { // Limitar a 7 días antes para eficiencia
          const dayBefore = addDays(startDay, -i);
          const dayBeforeKey = format(dayBefore, 'yyyy-MM-dd');
          const dayInfo = daysMap.get(dayBeforeKey);

          if (dayInfo && dayInfo.isFreeDay) {
            daysBeforeBlock++;
          } else {
            break;
          }
        }

        let daysAfterBlock = 0;
        for (let i = 1; i <= 7; i++) { // Limitar a 7 días después para eficiencia
          const dayAfter = addDays(blockDays[blockDays.length - 1], i);
          const dayAfterKey = format(dayAfter, 'yyyy-MM-dd');
          const dayInfo = daysMap.get(dayAfterKey);

          if (dayInfo && dayInfo.isFreeDay) {
            daysAfterBlock++;
          } else {
            break;
          }
        }

        // Calcular valor del bloque
        const totalConsecutiveDays = daysBeforeBlock + blockSize + daysAfterBlock;
        const efficiencyRatio = totalConsecutiveDays / blockSize;

        // Simplificar cálculo de puntuación
        let score = efficiencyRatio * totalConsecutiveDays * 100;

        // Bonificación simple para bloques largos
        if (totalConsecutiveDays >= 7) score *= 1.5;
        if (blockSize >= 3) score *= 1.2;

        // Análisis estratégico simplificado
        const hasWeekendConnection = blockDays.some(day => {
          const dayOfWeek = day.getDay();
          return dayOfWeek === 1 || dayOfWeek === 5; // Lunes o viernes
        });

        const hasHolidayConnection = blockDays.some(day => {
          const dayBefore = addDays(day, -1);
          const dayAfter = addDays(day, 1);
          return isHoliday(dayBefore) || isHoliday(dayAfter);
        });

        if (hasWeekendConnection) score *= 1.3;
        if (hasHolidayConnection) score *= 1.2;

        // Añadir oportunidad
        blockOpportunities.push({
          startDay,
          days: blockDays,
          blockSize,
          daysBeforeBlock,
          daysAfterBlock,
          totalConsecutiveDays,
          score,
          month: getMonth(startDay),
          effectiveDays: effectiveResult.effective,
        });
      }
    }

    // Ordenar por puntuación (solo las N mejores para mayor eficiencia)
    blockOpportunities.sort((a, b) => b.score - a.score);

    // SELECCIÓN GREEDY DE MEJORES BLOQUES
    const selectedBlocks: (BlockOpportunity & { id: string })[] = [];
    const finalSuggestedDays: Date[] = [];
    let daysRemaining = remainingPtoDays;
    const alternativesByBlockId: Record<string, BlockOpportunity[]> = {};
    const newDayToBlockIdMap: Record<string, string> = {};
    let blockIdCounter = 0;

    // Función para verificar conflictos
    const canAddBlock = (blockDays: Date[]) => {
      if (blockDays.length > daysRemaining) return false;

      for (const day of blockDays) {
        if (finalSuggestedDays.some(sd => isSameDay(sd, day))) {
          return false;
        }
      }
      return true;
    };

    // Seleccionar mejores bloques
    for (let i = 0; i < Math.min(blockOpportunities.length, 100); i++) { // Limitar a 100 para eficiencia
      if (daysRemaining <= 0) break;

      const block = blockOpportunities[i];

      if (canAddBlock(block.days)) {
        const blockId = `block_${++blockIdCounter}`;

        selectedBlocks.push({ ...block, id: blockId });
        finalSuggestedDays.push(...block.days);
        daysRemaining -= block.days.length;

        // Actualizar mapeo de días a bloques
        block.days.forEach(day => {
          newDayToBlockIdMap[format(day, 'yyyy-MM-dd')] = blockId;
        });

        // Buscar alternativas de manera eficiente
        const blockEffectiveDays = block.effectiveDays;
        const blockSize = block.blockSize;
        const alternativesForBlock: BlockOpportunity[] = [];

        // Crear conjunto de claves de días sugeridos para búsqueda rápida
        const suggestedDayKeys = new Set(finalSuggestedDays.map(d => format(d, 'yyyy-MM-dd')));

        // Limitar la búsqueda a solo 20 bloques con tamaño similar
        const potentialAlternatives = blockOpportunities
            .filter(op => op !== block && op.blockSize === blockSize)
            .slice(0, 30);

        for (const candidate of potentialAlternatives) {
          // Verificar que tenga la misma efectividad y no tenga conflictos
          if (Math.abs(candidate.effectiveDays - blockEffectiveDays) <= 1 &&
              !candidate.days.some(d => suggestedDayKeys.has(format(d, 'yyyy-MM-dd')))) {

            alternativesForBlock.push(candidate);

            if (alternativesForBlock.length >= MAX_ALTERNATIVES) break;
          }
        }

        alternativesByBlockId[blockId] = alternativesForBlock;
      }
    }

    return {
      suggestedDays: finalSuggestedDays,
      alternativeBlocks: alternativesByBlockId,
      dayToBlockIdMap: newDayToBlockIdMap,
    };
  }, [yearMap, availablePtoDays, selectedPtoDays.length, calculateEffectiveDays, isHoliday]);

  // Actualizar sugerencias con useTransition para evitar bloquear la UI
  useEffect(() => {
    const remainingDays = availablePtoDays - selectedPtoDays.length;

    if (remainingDays <= 0) {
      // Actualizaciones inmediatas para el caso simple
      setSuggestedDays([]);
      setAlternativeBlocks({});
      setDayToBlockIdMap({});
      setOptimizationSummary(`Has utilizado todos tus ${availablePtoDays} días PTO disponibles.`);
      setEffectiveDaysData(calculateEffectiveDays([]));
      return;
    }

    // Usar startTransition para las actualizaciones que requieren cálculos pesados
    startTransition(() => {
      const result = findOptimalGaps();
      const optimal = result.suggestedDays;
      const alternatives = result.alternativeBlocks;
      const newDayToBlockIdMap = result.dayToBlockIdMap;

      // Calcular datos efectivos con los días óptimos
      const effectiveData = calculateEffectiveDays(optimal);

      // Actualizar estados
      setSuggestedDays(optimal);
      setAlternativeBlocks(alternatives);
      setDayToBlockIdMap(newDayToBlockIdMap);
      setEffectiveDaysData(effectiveData);

      // Generar resumen de optimización
      if (optimal.length > 0) {
        // Agrupar por mes para el resumen
        const monthCounts: Record<string, number> = {};
        optimal.forEach(day => {
          const monthYear = format(day, 'MMMM yyyy', { locale: es });
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        });

        const summaryParts = Object.entries(monthCounts).map(
            ([month, count]) => `${count} días en ${month}`,
        );

        setOptimizationSummary(
            `¡Con tus ${availablePtoDays} días PTO conseguirás ${effectiveData.effective} días totales de vacaciones! ` +
            `(ratio ${effectiveData.ratio}x). Sugerencia: ${optimal.length} días distribuidos estratégicamente (${summaryParts.join(
                ', ')})`,
        );
      } else {
        setOptimizationSummary(
            `Tienes ${remainingDays} días PTO disponibles para asignar.`,
        );
      }
    });
  }, [availablePtoDays, selectedPtoDays.length, findOptimalGaps, calculateEffectiveDays]);

  // Memoizar funciones de eventos para evitar recreaciones
  const handleDayMouseOver = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const isSuggested = button.dataset.suggested === 'true';

    if (!isSuggested) return;

    const blockId = button.dataset.blockId;
    if (blockId && alternativeBlocks[blockId]) {
      setHoveredBlockId(blockId);
    }
  }, [alternativeBlocks]);

  const handleDayMouseOut = useCallback(() => {
    setHoveredBlockId(null);
  }, []);

  // Memoizar verificadores de día
  const isDaySuggested = useCallback((day: Date) =>
          suggestedDays.some(d => isSameDay(d, day)),
      [suggestedDays]);

  const isDayAlternative = useCallback((day: Date) => {
    if (!hoveredBlockId || suggestedDays.some(d => isSameDay(d, day))) {
      return false;
    }

    const alternatives = alternativeBlocks[hoveredBlockId] || [];
    return alternatives.some(block =>
        block.days && block.days.some(d => isSameDay(d, day)),
    );
  }, [hoveredBlockId, suggestedDays, alternativeBlocks]);

  // Memoizar clase de día para evitar recálculos
  const getDayClassName = useCallback((date: Date, displayMonth: Date) => {
    const classes = ['h-8 w-8 p-0 font-normal'];

    // Invisible day if not in current month (this check first for early return)
    if (!isSameMonth(date, displayMonth)) {
      classes.push('opacity-0 invisible');
      return classes.join(' ');
    }

    // Past day (not selectable if not allowed)
    if (!allowPastDays && date < new Date() && !selectedDays.some(d => isSameDay(d, date))) {
      classes.push('opacity-50 cursor-not-allowed');
    }

    // Apply styles based on day type
    if (isWeekend(date)) classes.push('bg-slate-100 text-slate-500');
    if (isHoliday(date)) classes.push('bg-yellow-100 text-yellow-800');
    if (isToday(date)) classes.push('ring-2 ring-blue-400');
    if (isDaySuggested(date)) classes.push('border-2 border-green-500');
    if (isDayAlternative(date)) classes.push('border-2 border-purple-500');

    // Selected day (weekends, holidays, or PTO days)
    if (selectedDays.some(d => isSameDay(d, date))) {
      if (!isWeekend(date) && !isHoliday(date)) {
        classes.push('bg-blue-500 text-white hover:bg-blue-600');
      }
    }

    return classes.join(' ');
  }, [isHoliday, isDaySuggested, isDayAlternative, selectedDays, allowPastDays]);

  // Handle day selection
  const handleDaySelect = useCallback((date: Date) => {
    if (!date) return;

    // Don't allow selecting weekends or holidays
    if (isWeekend(date) || isHoliday(date)) {
      return;
    }

    // Don't allow selecting past days if the option is not enabled
    if (!allowPastDays && date < new Date()) {
      alert('No puedes seleccionar días pasados. Activa la opción \'Permitir seleccionar días pasados\' si lo deseas.');
      return;
    }

    setSelectedDays(prev => {
      const isSelected = prev.some(d => isSameDay(d, date));

      if (isSelected) {
        // Remove the day
        return prev.filter(d => !isSameDay(d, date));
      } else {
        // Check if it exceeds the PTO day limit
        const currentPtoDays = prev.filter(d => !isWeekend(d) && !isHoliday(d)).length;

        if (currentPtoDays >= availablePtoDays) {
          alert(
              `No puedes seleccionar más de ${availablePtoDays} días PTO. Quita algún día para poder seleccionar otros.`);
          return prev;
        }

        // Add the day
        return [...prev, date];
      }
    });
  }, [isHoliday, availablePtoDays, allowPastDays]);

  // Get suggested days for a specific month
  const getSuggestedDaysForMonth = useCallback((month: Date) => {
    return suggestedDays.filter(day => isSameMonth(day, month));
  }, [suggestedDays]);

  // Generate summary of suggestions for a month as intervals
  const getMonthSummary = useCallback((month: Date) => {
    const suggestedInMonth = getSuggestedDaysForMonth(month);

    if (suggestedInMonth.length === 0) {
      return null;
    }

    // Sort days by date
    const sortedDays = [...suggestedInMonth].sort((a, b) => a.getTime() - b.getTime());

    // Group into intervals
    const intervals: Date[][] = [];
    let currentInterval: Date[] = [];

    if (sortedDays.length > 0) {
      currentInterval = [sortedDays[0]];

      for (let i = 1; i < sortedDays.length; i++) {
        const prevDay = sortedDays[i - 1];
        const currentDay = sortedDays[i];

        // If consecutive, add to current interval
        if (differenceInDays(currentDay, prevDay) === 1) {
          currentInterval.push(currentDay);
        } else {
          // If not consecutive, close current interval and start a new one
          intervals.push([...currentInterval]);
          currentInterval = [currentDay];
        }
      }

      // Don't forget the last interval
      if (currentInterval.length > 0) {
        intervals.push(currentInterval);
      }
    }

    // Calculate total free days for each interval
    const intervalsWithTotalDays = intervals.map(interval => {
      const effectiveResult = calculateEffectiveDays(interval);

      return {
        interval,
        ptoDays: interval.length,
        totalFreeDays: effectiveResult.effective,
        startDate: interval[0],
        endDate: interval[interval.length - 1],
      };
    });

    // Format the intervals
    const formattedIntervals = intervalsWithTotalDays.map(
        ({ interval, ptoDays, totalFreeDays }) => {
          const start = interval[0];
          const end = interval[interval.length - 1];

          let text = '';
          if (interval.length === 1) {
            // Single day
            text = `${getDate(start)} de ${format(start, 'MMMM', { locale: es })}: 1 día.`;
          } else {
            // Interval of days
            text = `${getDate(start)} al ${getDate(end)} de ${format(start, 'MMMM', { locale: es })}: ${ptoDays} días.`;
          }

          return {
            text,
            totalDays: totalFreeDays,
          };
        });

    return (
        <div className="text-xs mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700">
          <p className="font-semibold mb-1">Sugerencia:</p>
          {formattedIntervals.map(({ text, totalDays }, idx) => (
              <p key={idx} className={totalDays >= 7 ? 'font-semibold' : ''}>{text}</p>
          ))}

          <div className="mt-2 text-xs text-gray-600">
            <p>Pasa el cursor sobre un día sugerido <br /> para ver alternativas similares.</p>
          </div>
        </div>
    );
  }, [getSuggestedDaysForMonth, calculateEffectiveDays]);

  return (
      <main className="flex flex-col gap-8 items-center w-full">
        {optimizationSummary && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded w-full">
              <p className="text-sm">{optimizationSummary}</p>
              {isPending && (
                  <p className="text-xs text-blue-600 mt-1">Calculando optimizaciones...</p>
              )}
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthsToShow.map((month, index) => {
            const gridClass = index >= 6 && index <= 12
                ? 'lg:row-start-2'
                : '';
            return <Card key={month.toISOString()} className={`mb-4 flex flex-col ${gridClass}`}>
              <Calendar
                  mode="multiple"
                  selected={selectedDays}
                  onSelect={handleDaySelect}
                  className="rounded-md border"
                  defaultMonth={month}
                  month={month}
                  weekStartsOn={1}
                  fixedWeeks
                  locale={es}
                  components={{
                    IconRight: () => null,
                    IconLeft: () => null,
                    IconDropdown: () => null,
                    Day: ({ day, date, displayMonth, ...props }) => {
                      const holiday = getHolidayName(date);
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const isSuggested = isDaySuggested(date);
                      const blockId = isSuggested ? dayToBlockIdMap[dateKey] || '' : '';

                      return (
                          <div className="relative">
                            <button
                                type="button"
                                {...props}
                                className={`${props.className || ''} ${getDayClassName(date, displayMonth)}`}
                                title={holiday || ''}
                                data-suggested={isSuggested ? 'true' : 'false'}
                                data-block-id={blockId}
                                data-date={dateKey}
                                onMouseOver={handleDayMouseOver}
                                onMouseOut={handleDayMouseOut}
                                onBlur={handleDayMouseOut}
                                onFocus={handleDayMouseOver}
                            >
                              {date.getDate()}
                            </button>
                          </div>
                      );
                    },
                  }}
              />
              {getMonthSummary(month)}
            </Card>;
          })}
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-slate-100 mr-2 border border-slate-300"></div>
              <span>Fines de semana</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 mr-2 border border-yellow-300"></div>
              <span>Festivos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 mr-2"></div>
              <span>Días PTO seleccionados</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-green-500 mr-2"></div>
              <span>Días sugeridos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-purple-500 mr-2"></div>
              <span>Alternativas similares ({(ALTERNATIVE_THRESHOLD * 100).toFixed(0)}%)</span>
            </div>
          </div>
          <p>Los fines de semana y festivos ya están preseleccionados.
            Haz clic en cualquier día laborable para añadirlo como día PTO.</p>
        </footer>
      </main>
  );
}