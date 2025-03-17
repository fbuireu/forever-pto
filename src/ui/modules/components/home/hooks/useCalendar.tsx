import type { HolidayDTO } from '@application/dto/holiday/types';
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
    isWeekend,
    parseISO,
    startOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'; // Constantes

const MAX_BLOCK_SIZE = 5;
const MAX_ALTERNATIVES = 10;
const MAX_CANDIDATE_ALTERNATIVES = 50;
const MAX_SEARCH_DEPTH = 100;

// Funciones utilitarias
export const getDateKey = (date: Date): string => format(date, "yyyy-MM-dd");
const getDateFromKey = (key: string): Date => parseISO(key);

// Interfaces
interface DayInfo {
	date: Date;
	isWeekend: boolean;
	isHoliday: boolean;
	isSelected: boolean;
	isFreeDay: boolean;
	month: number;
}

export interface BlockOpportunity {
	startDay: Date;
	days: Date[];
	blockSize: number;
	daysBeforeBlock: number;
	daysAfterBlock: number;
	totalConsecutiveDays: number;
	score: number;
	month: number;
	effectiveDays: number;
}

interface PTOCalculatorProps {
	year: number;
	ptoDays: number;
	allowPastDays: string;
	holidays: HolidayDTO[];
	carryOverMonths: number;
}

// Función para agrupar días en secuencias consecutivas
function groupConsecutiveDays(days: Date[]): Date[][] {
	if (days.length === 0) return [];

	// Ordenar días por fecha
	const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());

	const sequences: Date[][] = [];
	let currentSequence: Date[] = [sortedDays[0]];

	for (let i = 1; i < sortedDays.length; i++) {
		const prevDay = sortedDays[i - 1];
		const currentDay = sortedDays[i];

		// Si es el día siguiente, añadir a la secuencia actual
		if (differenceInDays(currentDay, prevDay) === 1) {
			currentSequence.push(currentDay);
		} else {
			// Si no es consecutivo, cerrar secuencia actual y empezar una nueva
			sequences.push([...currentSequence]);
			currentSequence = [currentDay];
		}
	}

	// Añadir la última secuencia
	if (currentSequence.length > 0) {
		sequences.push(currentSequence);
	}

	return sequences;
}

export function useCalendar({ year, ptoDays, allowPastDays, holidays, carryOverMonths }: PTOCalculatorProps) {
	// Estados
	const [selectedDays, setSelectedDays] = useState<Date[]>([]);
	const [suggestedDays, setSuggestedDays] = useState<Date[]>([]);
	const [alternativeBlocks, setAlternativeBlocks] = useState<Record<string, BlockOpportunity[]>>({});
	const [dayToBlockIdMap, setDayToBlockIdMap] = useState<Record<string, string>>({});
	const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	// Verificar si se permiten días pasados
	const isPastDayAllowed = useCallback(() => {
		return !(allowPastDays === "false");
	}, [allowPastDays]);

	// Generar meses a mostrar
	const monthsToShowDates = useMemo(() => {
		const start = startOfMonth(new Date(year, 0, 1));
		const totalMonths = carryOverMonths + 12;
		return Array.from({ length: totalMonths }, (_, i) => addMonths(start, i));
	}, [year, carryOverMonths]);

	// Crear mapa de días festivos para búsqueda O(1)
	const holidaysMap = useMemo(() => {
		const map = new Map<string, HolidayDTO>();
		holidays.forEach((holiday) => {
			const key = getDateKey(holiday.date);
			map.set(key, holiday);
		});
		return map;
	}, [holidays]);

	// Verificar si un día es festivo - O(1)
	const isHoliday = useCallback(
		(date: Date): boolean => {
			return holidaysMap.has(getDateKey(date));
		},
		[holidaysMap],
	);

	// Obtener nombre del festivo si existe
	const getHolidayName = useCallback(
		(date: Date): string | null => {
			const holiday = holidaysMap.get(getDateKey(date));
			return holiday ? holiday.name : null;
		},
		[holidaysMap],
	);

	// Inicializar con fines de semana y festivos
	useEffect(() => {
		// Set para evitar duplicados
		const initialSelectionSet = new Set<string>();
		const initialSelection: Date[] = [];

		// Añadir todos los fines de semana del año
		monthsToShowDates.forEach((month) => {
			const daysInMonth = eachDayOfInterval({
				start: startOfMonth(month),
				end: endOfMonth(month),
			});

			daysInMonth.forEach((day) => {
				if (isWeekend(day)) {
					const key = getDateKey(day);
					if (!initialSelectionSet.has(key)) {
						initialSelectionSet.add(key);
						initialSelection.push(day);
					}
				}
			});
		});

		// Añadir festivos (si no están ya como fin de semana)
		holidays.forEach((holiday) => {
			const key = getDateKey(holiday.date);
			if (!initialSelectionSet.has(key)) {
				initialSelectionSet.add(key);
				initialSelection.push(holiday.date);
			}
		});

		setSelectedDays(initialSelection);
	}, [holidays, monthsToShowDates]);

	// Filtrar solo días de PTO (excluyendo fines de semana y festivos)
	const selectedPtoDays = useMemo(() => {
		return selectedDays.filter((day) => !isWeekend(day) && !isHoliday(day));
	}, [selectedDays, isHoliday]);

	// Crear mapa de días libres base (fines de semana, festivos, PTO)
	const freeDaysBaseMap = useMemo(() => {
		const map = new Map<string, Date>();

		// Añadir fines de semana
		monthsToShowDates.forEach((month) => {
			eachDayOfInterval({
				start: startOfMonth(month),
				end: endOfMonth(month),
			}).forEach((day) => {
				if (isWeekend(day)) {
					map.set(getDateKey(day), day);
				}
			});
		});

		// Añadir festivos
		holidays.forEach((holiday) => {
			map.set(getDateKey(holiday.date), holiday.date);
		});

		// Añadir días PTO seleccionados
		selectedPtoDays.forEach((day) => {
			map.set(getDateKey(day), day);
		});

		return map;
	}, [monthsToShowDates, holidays, selectedPtoDays]);

	// Calcular días efectivos (función optimizada)
	const calculateEffectiveDays = useCallback(
		(ptoDaysToAdd: Date[] = []): { effective: number; ratio: number } => {
			// Si no hay días PTO seleccionados ni añadidos, retornar cero
			if (selectedPtoDays.length === 0 && ptoDaysToAdd.length === 0) {
				return { effective: 0, ratio: 0 };
			}

			// Crear una copia del mapa base
			const freeDaysMap = new Map(freeDaysBaseMap);

			// Añadir los días PTO adicionales
			ptoDaysToAdd.forEach((day) => {
				const dayKey = getDateKey(day);
				if (!freeDaysMap.has(dayKey)) {
					freeDaysMap.set(dayKey, day);
				}
			});

			// Convertir el mapa a un array ordenado
			const freeDays = Array.from(freeDaysMap.values()).sort((a, b) => a.getTime() - b.getTime());

			// Agrupar en secuencias de días consecutivos
			const sequences = groupConsecutiveDays(freeDays);

			// Set de claves de días PTO para búsquedas O(1)
			const ptoDayKeys = new Set([...selectedPtoDays.map(getDateKey), ...ptoDaysToAdd.map(getDateKey)]);

			// Calcular días efectivos (secuencias que incluyen al menos un día PTO)
			let effectiveDays = 0;

			sequences.forEach((sequence) => {
				// Verificar si algún día de la secuencia es un día PTO
				const hasAnyPtoDay = sequence.some((day) => ptoDayKeys.has(getDateKey(day)));

				if (hasAnyPtoDay) {
					effectiveDays += sequence.length;
				}
			});

			// Calcular ratio (días efectivos / días PTO)
			const totalPtoDays = ptoDayKeys.size;
			const ratio = Number.parseFloat((effectiveDays / totalPtoDays).toFixed(1));

			return { effective: effectiveDays, ratio };
		},
		[freeDaysBaseMap, selectedPtoDays],
	);

	// Crear mapa de información de todos los días del año
	const yearMap = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const map = new Map<string, DayInfo>();
		let allDays: Date[] = [];

		// Procesar todos los meses
		monthsToShowDates.forEach((month) => {
			const daysInMonth = eachDayOfInterval({
				start: startOfMonth(month),
				end: endOfMonth(month),
			});
			allDays.push(...daysInMonth);
		});

		// Filtrar días pasados si no están permitidos
		if (!isPastDayAllowed()) {
			allDays = allDays.filter((day) => day >= today);
		}

		// Crear Set para búsquedas rápidas de días seleccionados
		const selectedDaysSet = new Set(selectedDays.map(getDateKey));
		const selectedPtoDaysSet = new Set(selectedPtoDays.map(getDateKey));

		// Crear mapa de información de días
		allDays.forEach((day) => {
			const dayKey = getDateKey(day);
			const isWeekendDay = isWeekend(day);
			const isHolidayDay = isHoliday(day);
			const isAlreadySelected = selectedPtoDaysSet.has(dayKey);

			map.set(dayKey, {
				date: day,
				isWeekend: isWeekendDay,
				isHoliday: isHolidayDay,
				isSelected: isAlreadySelected,
				isFreeDay: isWeekendDay || isHolidayDay || isAlreadySelected,
				month: getMonth(day),
			});
		});

		return { map, allDays };
	}, [monthsToShowDates, isHoliday, selectedDays, selectedPtoDays, isPastDayAllowed]);

	// Función principal para encontrar huecos óptimos - VERSIÓN SIMPLIFICADA
	const findOptimalGaps = useCallback(() => {
		const remainingPtoDays = ptoDays - selectedPtoDays.length;

		// Si no quedan días PTO, retornar resultado vacío
		if (remainingPtoDays <= 0) {
			return {
				suggestedDays: [],
				alternativeBlocks: {},
				dayToBlockIdMap: {},
			};
		}

		const { map: daysMap, allDays } = yearMap;

		// Filtrar solo días laborables disponibles
		const availableWorkdays = allDays.filter((day) => {
			const dayInfo = daysMap.get(getDateKey(day));
			return dayInfo && !dayInfo.isFreeDay;
		});

		// Estructura para almacenar oportunidades de bloque
		const blockOpportunities: BlockOpportunity[] = [];

		// Evaluar bloques para cada posible día de inicio
		for (let startDayIndex = 0; startDayIndex < availableWorkdays.length; startDayIndex++) {
			const startDay = availableWorkdays[startDayIndex];

			// Intentar bloques de diferentes tamaños
			for (let blockSize = 1; blockSize <= Math.min(MAX_BLOCK_SIZE, remainingPtoDays); blockSize++) {
				// Verificar si tenemos suficientes días disponibles
				if (startDayIndex + blockSize > availableWorkdays.length) {
					continue;
				}

				// Verificar si podemos formar un bloque válido
				let validBlock = true;
				const blockDays: Date[] = [];

				// Añadir días al bloque
				for (let i = 0; i < blockSize; i++) {
					const day = availableWorkdays[startDayIndex + i];

					// Si no es el primer día, verificar que sea consecutivo
					if (blockDays.length > 0) {
						const lastDay = blockDays[blockDays.length - 1];
						if (differenceInDays(day, lastDay) !== 1) {
							validBlock = false;
							break;
						}
					}

					blockDays.push(day);
				}

				if (!validBlock || blockDays.length === 0) continue;

				// Calcular días libres antes y después del bloque
				let daysBeforeBlock = 0;
				for (let i = 1; i <= 7; i++) {
					const dayBefore = addDays(blockDays[0], -i);
					const dayInfo = daysMap.get(getDateKey(dayBefore));

					if (dayInfo?.isFreeDay) {
						daysBeforeBlock++;
					} else {
						break;
					}
				}

				let daysAfterBlock = 0;
				for (let i = 1; i <= 7; i++) {
					const dayAfter = addDays(blockDays[blockDays.length - 1], i);
					const dayInfo = daysMap.get(getDateKey(dayAfter));

					if (dayInfo?.isFreeDay) {
						daysAfterBlock++;
					} else {
						break;
					}
				}

				// Calcular valor del bloque
				const totalConsecutiveDays = daysBeforeBlock + blockSize + daysAfterBlock;
				const efficiencyRatio = totalConsecutiveDays / blockSize;
				let score = efficiencyRatio * totalConsecutiveDays * 100;

				// Bonificaciones simples
				if (totalConsecutiveDays >= 7) score *= 1.5;
				if (blockSize >= 3) score *= 1.2;

				// Calcular días efectivos
				const effectiveResult = calculateEffectiveDays(blockDays);

				// Añadir oportunidad de bloque
				blockOpportunities.push({
					startDay: blockDays[0],
					days: blockDays,
					blockSize: blockDays.length,
					daysBeforeBlock,
					daysAfterBlock,
					totalConsecutiveDays,
					score,
					month: getMonth(blockDays[0]),
					effectiveDays: effectiveResult.effective,
				});
			}
		}

		// Ordenar por puntuación
		blockOpportunities.sort((a, b) => b.score - a.score);

		// Seleccionar mejores bloques sin conflictos
		const selectedBlocks: (BlockOpportunity & { id: string })[] = [];
		const finalSuggestedDays: Date[] = [];
		const suggestedDaysSet = new Set<string>();
		let daysRemaining = remainingPtoDays;
		let blockIdCounter = 0;

		// Función para verificar conflictos
		const canAddBlock = (blockDays: Date[]) => {
			if (blockDays.length > daysRemaining) return false;

			// Verificar si algún día ya está seleccionado
			for (const day of blockDays) {
				if (suggestedDaysSet.has(getDateKey(day))) {
					return false;
				}
			}
			return true;
		};

		// Seleccionar mejores bloques (limitado para eficiencia)
		for (let i = 0; i < Math.min(blockOpportunities.length, MAX_SEARCH_DEPTH); i++) {
			if (daysRemaining <= 0) break;

			const block = blockOpportunities[i];

			if (canAddBlock(block.days)) {
				const blockId = `block_${++blockIdCounter}`;

				// Añadir bloque seleccionado
				selectedBlocks.push({ ...block, id: blockId });

				// Actualizar días sugeridos
				block.days.forEach((day) => {
					finalSuggestedDays.push(day);
					suggestedDaysSet.add(getDateKey(day));
				});

				daysRemaining -= block.days.length;
			}
		}

		// Crear mapa de día a ID de bloque
		const newDayToBlockIdMap: Record<string, string> = {};
		selectedBlocks.forEach((block) => {
			block.days.forEach((day) => {
				newDayToBlockIdMap[getDateKey(day)] = block.id;
			});
		});

		// Crear alternativas para cada bloque
		const alternativesByBlockId: Record<string, BlockOpportunity[]> = {};

		selectedBlocks.forEach((block) => {
			const alternativesForBlock: BlockOpportunity[] = [];
			const blockEffective = block.effectiveDays;

			// CORRECCIÓN: Buscar alternativas que tengan efectividad similar
			const potentialAlternatives = blockOpportunities
				.filter(
					(op) =>
						op !== block &&
						op.blockSize === block.blockSize &&
						Math.abs(op.effectiveDays - blockEffective) <= 1 &&
						// No debe tener conflicto con días ya sugeridos
						!op.days.some((d) => suggestedDaysSet.has(getDateKey(d))),
				)
				.slice(0, MAX_CANDIDATE_ALTERNATIVES); // Usar límite mayor para candidatos

			for (const alt of potentialAlternatives) {
				alternativesForBlock.push(alt);
				if (alternativesForBlock.length >= MAX_ALTERNATIVES) break;
			}

			alternativesByBlockId[block.id] = alternativesForBlock;
		});

		return {
			suggestedDays: finalSuggestedDays,
			alternativeBlocks: alternativesByBlockId,
			dayToBlockIdMap: newDayToBlockIdMap,
		};
	}, [yearMap, ptoDays, selectedPtoDays.length, calculateEffectiveDays]);

	// Actualizar sugerencias cuando cambien las dependencias
	useEffect(() => {
		const remainingDays = ptoDays - selectedPtoDays.length;

		if (remainingDays <= 0 || ptoDays <= 0) {
			// Actualizaciones inmediatas para casos simples
			setSuggestedDays([]);
			setAlternativeBlocks({});
			setDayToBlockIdMap({});
			return;
		}

		// Usar startTransition para cálculos pesados
		startTransition(() => {
			try {
				const result = findOptimalGaps();
				setSuggestedDays(result.suggestedDays);
				setAlternativeBlocks(result.alternativeBlocks);
				setDayToBlockIdMap(result.dayToBlockIdMap);
			} catch (error) {
				console.error("Error en findOptimalGaps:", error);
				// Establecer valores por defecto en caso de error
				setSuggestedDays([]);
				setAlternativeBlocks({});
				setDayToBlockIdMap({});
			}
		});
	}, [ptoDays, selectedPtoDays.length, findOptimalGaps]);

	// Manejar interacción con días (mostrar alternativas)
	const handleDayInteraction = useCallback(
		(e: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>) => {
			const button = e.currentTarget;
			const isSuggested = button.dataset.suggested === "true";

			if (!isSuggested) return;

			const blockId = button.dataset.blockId;
			if (blockId && alternativeBlocks[blockId]) {
				setHoveredBlockId(blockId);
			}
		},
		[alternativeBlocks],
	);

	// Eliminar resaltado de alternativas al quitar el mouse
	const handleDayMouseOut = useCallback(() => {
		setHoveredBlockId(null);
	}, []);

	// Verificar si un día está sugerido
	const isDaySuggested = useCallback(
		(day: Date) => {
			const dayKey = getDateKey(day);
			return !!dayToBlockIdMap[dayKey];
		},
		[dayToBlockIdMap],
	);

	// Verificar si un día es alternativo
	const isDayAlternative = useCallback(
		(day: Date) => {
			if (!hoveredBlockId || isDaySuggested(day)) {
				return false;
			}

			const alternatives = alternativeBlocks[hoveredBlockId] || [];
			const dayKey = getDateKey(day);

			// Buscar en alternativas (optimizado)
			for (const block of alternatives) {
				if (block.days.some((d) => getDateKey(d) === dayKey)) {
					return true;
				}
			}

			return false;
		},
		[hoveredBlockId, alternativeBlocks, isDaySuggested],
	);

	// Determinar posición de un día en su bloque
	const getDayPositionInBlock = useCallback(
		(date: Date) => {
			if (!isDaySuggested(date)) return null;

			const dateKey = getDateKey(date);
			const blockId = dayToBlockIdMap[dateKey] || "";
			if (!blockId) return null;

			// Encontrar todos los días con el mismo blockId
			const blockDayKeys = Object.entries(dayToBlockIdMap)
				.filter(([, id]) => id === blockId)
				.map(([dayKey]) => dayKey);

			if (blockDayKeys.length <= 1) return "single";

			// Ordenar días del bloque
			const blockDays = blockDayKeys.map(getDateFromKey).sort((a, b) => a.getTime() - b.getTime());

			// Determinar posición
			const index = blockDays.findIndex((d) => isSameDay(d, date));
			if (index === 0) return "start";
			if (index === blockDays.length - 1) return "end";
			return "middle";
		},
		[isDaySuggested, dayToBlockIdMap],
	);

	// Determinar posición de un día alternativo en su bloque
	const getAlternativeDayPosition = useCallback(
		(date: Date) => {
			if (!hoveredBlockId || !isDayAlternative(date)) return null;

			const alternatives = alternativeBlocks[hoveredBlockId] || [];
			const dateKey = getDateKey(date);

			// Buscar en bloques alternativos
			for (const block of alternatives) {
				if (!block.days || block.days.length === 0) continue;

				// Ordenar días del bloque
				const blockDays = [...block.days].sort((a, b) => a.getTime() - b.getTime());

				// Buscar posición del día en este bloque
				const dayIndex = blockDays.findIndex((d) => getDateKey(d) === dateKey);

				if (dayIndex >= 0) {
					if (blockDays.length === 1) return "single";
					if (dayIndex === 0) return "start";
					if (dayIndex === blockDays.length - 1) return "end";
					return "middle";
				}
			}

			return null;
		},
		[hoveredBlockId, isDayAlternative, alternativeBlocks],
	);

	// Manejar selección de día
	const handleDaySelect = useCallback(
		(days: Date[] | undefined) => {
			if (!days || days.length === 0) return;

			const date = days[days.length - 1]; // Tomar el último día seleccionado
			if (!date) return;

			// No permitir seleccionar fines de semana o festivos
			if (isWeekend(date) || isHoliday(date)) {
				return;
			}

			// No permitir seleccionar días pasados si no está permitido
			if (!isPastDayAllowed() && date < new Date()) {
				alert("No puedes seleccionar días pasados. Activa la opción 'Permitir seleccionar días pasados' si lo deseas.");
				return;
			}

			setSelectedDays((prev) => {
				// Crear Set para búsqueda rápida
				const prevSet = new Set(prev.map(getDateKey));
				const dateKey = getDateKey(date);
				const isSelected = prevSet.has(dateKey);

				if (isSelected) {
					// Quitar el día
					return prev.filter((d) => !isSameDay(d, date));
				}

				// Verificar límite de días PTO
				const currentPtoDays = prev.filter((d) => !isWeekend(d) && !isHoliday(d)).length;

				if (currentPtoDays >= ptoDays) {
					alert(`No puedes seleccionar más de ${ptoDays} días PTO. Quita algún día para poder seleccionar otros.`);
					return prev;
				}

				// Añadir el día
				return [...prev, date];
			});
		},
		[isHoliday, ptoDays, isPastDayAllowed],
	);

	// Obtener días sugeridos para un mes específico
	const getSuggestedDaysForMonth = useCallback(
		(month: Date) => {
			return suggestedDays.filter((day) => isSameMonth(day, month));
		},
		[suggestedDays],
	);

	// Generar resumen de sugerencias para un mes
	const getMonthSummary = useCallback(
		(month: Date) => {
			if (ptoDays <= 0 || suggestedDays.length === 0) {
				return null;
			}

			// Obtener días sugeridos para este mes
			const suggestedInMonth = getSuggestedDaysForMonth(month);
			if (!suggestedInMonth || suggestedInMonth.length === 0) {
				return null;
			}

			// Agrupar en intervalos
			const intervals = groupConsecutiveDays(suggestedInMonth);
			if (intervals.length === 0) {
				return null;
			}

			// Calcular días libres totales para cada intervalo
			const intervalsWithTotalDays = intervals.map((interval) => {
				const effectiveResult = calculateEffectiveDays(interval);

				return {
					interval,
					ptoDays: interval.length,
					totalFreeDays: effectiveResult.effective,
					startDate: interval[0],
					endDate: interval[interval.length - 1],
				};
			});

			// Formatear los intervalos
			const formattedIntervals = intervalsWithTotalDays.map(({ interval, ptoDays, totalFreeDays }) => {
				const start = interval[0];
				const end = interval[interval.length - 1];

				let text: string;
				if (interval.length === 1) {
					text = `${getDate(start)} de ${format(start, "MMMM", { locale: es })}: 1 día.`;
				} else {
					text = `${getDate(start)} al ${getDate(end)} de ${format(start, "MMMM", { locale: es })}: ${ptoDays} días.`;
				}

				return {
					text,
					totalDays: totalFreeDays,
				};
			});

			if (formattedIntervals.length === 0) {
				return null;
			}

			return (
				<>
					{formattedIntervals.map(({ text, totalDays }) => (
						<p key={text} className={totalDays >= 7 ? "font-medium text-primary" : ""}>
							{text}
						</p>
					))}
				</>
			);
		},
		[ptoDays, suggestedDays, getSuggestedDaysForMonth, calculateEffectiveDays],
	);

	return {
		selectedDays,
		suggestedDays,
		alternativeBlocks,
		dayToBlockIdMap,
		hoveredBlockId,
		isPending,
		monthsToShowDates,
		selectedPtoDays,
		isHoliday,
		getHolidayName,
		isPastDayAllowed,
		isDaySuggested,
		isDayAlternative,
		getDayPositionInBlock,
		getAlternativeDayPosition,
		getSuggestedDaysForMonth,
		getMonthSummary,
		handleDaySelect,
		handleDayInteraction,
		handleDayMouseOut,
		calculateEffectiveDays,
	};
}
