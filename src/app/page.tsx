"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    format,
    addMonths,
    getYear,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    isWeekend,
    addDays,
    isSameMonth,
    getDate,
    getMonth,
    differenceInDays
} from "date-fns";
import { es } from "date-fns/locale";
import Combobox from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';

// Constantes
const DEFAULT_PTO_DAYS = 22;
const MONTHS_TO_DISPLAY = 12;
const ALTERNATIVE_THRESHOLD = 0.75; // Umbral para considerar opciones similares (75%)
const countryOptions = [
    { value: "es", label: "España" },
    { value: "us", label: "EEUU" },
    { value: "uk", label: "Reino Unido" }
];
const regionsInSpain = [
    { value: "ca", label: "Cataluña" },
    { value: "md", label: "Madrid" },
    { value: "ex", label: "Extremadura" }
];

// Base de datos de días festivos por país
const holidaysByCountry = {
    es: [
        { date: new Date(2025, 0, 1), name: "Año Nuevo" },
        { date: new Date(2025, 0, 6), name: "Reyes Magos" },
        { date: new Date(2025, 3, 18), name: "Viernes Santo" },
        { date: new Date(2025, 4, 1), name: "Día del Trabajador" },
        { date: new Date(2025, 7, 15), name: "Asunción" },
        { date: new Date(2025, 9, 12), name: "Día de la Hispanidad" },
        { date: new Date(2025, 10, 1), name: "Todos los Santos" },
        { date: new Date(2025, 11, 6), name: "Día de la Constitución" },
        { date: new Date(2025, 11, 8), name: "Inmaculada Concepción" },
        { date: new Date(2025, 11, 25), name: "Navidad" },
    ],
    ca: [
        { date: new Date(2025, 0, 1), name: "Any Nou" },
        { date: new Date(2025, 0, 6), name: "Reis" },
        { date: new Date(2025, 3, 18), name: "Divendres Sant" },
        { date: new Date(2025, 3, 21), name: "Pasqua Florida" },
        { date: new Date(2025, 4, 1), name: "Dia del Treball" },
        { date: new Date(2025, 5, 24), name: "Sant Joan" },
        { date: new Date(2025, 7, 15), name: "Mare de Déu d'Agost" },
        { date: new Date(2025, 8, 11), name: "Diada Nacional" },
        { date: new Date(2025, 10, 1), name: "Tots Sants" },
        { date: new Date(2025, 11, 6), name: "Dia de la Constitució" },
        { date: new Date(2025, 11, 8), name: "Immaculada Concepció" },
        { date: new Date(2025, 11, 25), name: "Nadal" },
        { date: new Date(2025, 11, 26), name: "Sant Esteve" },
    ],
    us: [
        { date: new Date(2025, 0, 1), name: "New Year's Day" },
        { date: new Date(2025, 0, 20), name: "Martin Luther King Jr. Day" },
        { date: new Date(2025, 1, 17), name: "Presidents' Day" },
        { date: new Date(2025, 4, 26), name: "Memorial Day" },
        { date: new Date(2025, 5, 19), name: "Juneteenth" },
        { date: new Date(2025, 6, 4), name: "Independence Day" },
        { date: new Date(2025, 8, 1), name: "Labor Day" },
        { date: new Date(2025, 9, 13), name: "Columbus Day" },
        { date: new Date(2025, 10, 11), name: "Veterans Day" },
        { date: new Date(2025, 10, 27), name: "Thanksgiving" },
        { date: new Date(2025, 11, 25), name: "Christmas" },
    ],
    uk: [
        { date: new Date(2025, 0, 1), name: "New Year's Day" },
        { date: new Date(2025, 3, 18), name: "Good Friday" },
        { date: new Date(2025, 3, 21), name: "Easter Monday" },
        { date: new Date(2025, 4, 5), name: "Early May Bank Holiday" },
        { date: new Date(2025, 4, 26), name: "Spring Bank Holiday" },
        { date: new Date(2025, 7, 25), name: "Summer Bank Holiday" },
        { date: new Date(2025, 11, 25), name: "Christmas Day" },
        { date: new Date(2025, 11, 26), name: "Boxing Day" },
    ],
};

// Función mejorada para obtener los días festivos con año actualizado
const getHolidays = (country, region, year) => {
    let holidayList = [];

    // Función auxiliar para agregar festivos y actualizar el año
    const addHolidaysWithYear = (sourceCountry, targetYear, suffix = "") => {
        if (holidaysByCountry[sourceCountry]) {
            const mappedHolidays = holidaysByCountry[sourceCountry].map(holiday => ({
                date: new Date(targetYear, holiday.date.getMonth(), holiday.date.getDate()),
                name: holiday.name + suffix
            }));

            holidayList = [...holidayList, ...mappedHolidays];
        }
    };

    // Añadir festivos nacionales del año actual
    addHolidaysWithYear(country, year);

    // Añadir festivos regionales si están disponibles
    if (region && holidaysByCountry[region]) {
        // Reemplazar los festivos con los regionales específicos
        holidayList = [];
        addHolidaysWithYear(region, year);
    }

    // Añadir festivos de enero del año siguiente (importante para optimizar fin de año)
    const nextYear = year + 1;

    // Añadir solo los festivos de enero del siguiente año
    if (holidaysByCountry[country]) {
        const januaryHolidays = holidaysByCountry[country]
            .filter(holiday => holiday.date.getMonth() === 0); // Solo enero (mes 0)

        januaryHolidays.forEach(holiday => {
            holidayList.push({
                date: new Date(nextYear, 0, holiday.date.getDate()),
                name: holiday.name + " (siguiente año)"
            });
        });
    }

    // Añadir festivos regionales de enero del siguiente año
    if (region && holidaysByCountry[region]) {
        const januaryRegionalHolidays = holidaysByCountry[region]
            .filter(holiday => holiday.date.getMonth() === 0);

        januaryRegionalHolidays.forEach(holiday => {
            holidayList.push({
                date: new Date(nextYear, 0, holiday.date.getDate()),
                name: holiday.name + " (siguiente año)"
            });
        });
    }

    return holidayList;
};

// Interfaces para tipado
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
    effectiveDays: number; // Días efectivos totales que se consiguen
}

export default function PTOPlanner() {
    // Estados
    const [selectedCountry, setSelectedCountry] = useState("es");
    const [selectedRegion, setSelectedRegion] = useState(selectedCountry === "es" ? "ca" : "");
    const [availablePtoDays, setAvailablePtoDays] = useState(DEFAULT_PTO_DAYS);
    const [selectedDays, setSelectedDays] = useState([]);
    const [suggestedDays, setSuggestedDays] = useState([]); // Días sugeridos
    const [alternativeBlocks, setAlternativeBlocks] = useState({}); // Mapa de alternativas por ID de bloque
    const [dayToBlockIdMap, setDayToBlockIdMap] = useState({}); // Mapa de días a IDs de bloque
    const [year, setYear] = useState(getYear(new Date()));
    const [optimizationSummary, setOptimizationSummary] = useState("");
    const [effectiveDaysData, setEffectiveDaysData] = useState({ effective: 0, ratio: 0 });
    const [allowPastDays, setAllowPastDays] = useState(false); // Estado para permitir días pasados
    const [hoveredDay, setHoveredDay] = useState(null); // Día sobre el que se hace hover
    const [hoveredBlockId, setHoveredBlockId] = useState(null); // ID del bloque activo

    // Días alternativos para el bloque activo - optimizado usando useMemo con memorización apropiada
    const activeAlternatives = useMemo(() => {
        if (!hoveredBlockId) return [];

        // Comprobar si hay alternativas para este bloque
        const alternatives = alternativeBlocks[hoveredBlockId];
        if (!alternatives || alternatives.length === 0) return [];

        // Convertir días alternativos a un conjunto plano
        return alternatives.flatMap(block =>
            Array.isArray(block.days) ? block.days : []
        );
    }, [hoveredBlockId, alternativeBlocks]);

    // Generar meses a mostrar basados en el año, incluyendo enero del año siguiente
    const monthsToShow = useMemo(() => {
        const start = startOfMonth(new Date(year, 0, 1));
        const months = Array.from({ length: MONTHS_TO_DISPLAY }, (_, i) => addMonths(start, i));

        // Añadir enero del año siguiente
        const nextJanuary = startOfMonth(new Date(year + 1, 0, 1));
        return [...months, nextJanuary];
    }, [year]);

    // Obtener días festivos según país, región y año (incluido enero siguiente)
    const holidays = useMemo(() => {
        const regionToUse = selectedRegion ? selectedRegion : null;
        return getHolidays(selectedCountry, regionToUse, year);
    }, [selectedCountry, selectedRegion, year]);

    // Función para verificar si un día es festivo
    const isHoliday = useCallback((date) => {
        return holidays.some(holiday => isSameDay(holiday.date, date));
    }, [holidays]);

    // Función para obtener el nombre del festivo si existe
    const getHolidayName = useCallback((date) => {
        const holiday = holidays.find(h => isSameDay(h.date, date));
        return holiday ? holiday.name : null;
    }, [holidays]);

    // Inicializar con fines de semana y festivos
    useEffect(() => {
        const initialSelection = [];

        // Añadir todos los fines de semana del año
        monthsToShow.forEach(month => {
            const daysInMonth = eachDayOfInterval({
                start: startOfMonth(month),
                end: endOfMonth(month)
            });

            daysInMonth.forEach(day => {
                if (isWeekend(day)) {
                    initialSelection.push(day);
                }
            });
        });

        // Añadir festivos
        holidays.forEach(holiday => {
            if (!initialSelection.some(day => isSameDay(day, holiday.date))) {
                initialSelection.push(holiday.date);
            }
        });

        setSelectedDays(initialSelection);
    }, [holidays, monthsToShow, year]);

    // Calcular días PTO seleccionados (solo días laborables)
    const selectedPtoDays = useMemo(() => {
        return selectedDays.filter(day =>
            !isWeekend(day) && !isHoliday(day)
        );
    }, [selectedDays, isHoliday]);

    // Calcular días efectivos - versión completamente reescrita y simplificada
    const calculateEffectiveDays = useCallback((ptoDaysToAdd = []) => {
        // Combinar días PTO seleccionados y los adicionales
        const allPtoDays = [...selectedPtoDays];
        ptoDaysToAdd.forEach(day => {
            if (!allPtoDays.some(d => isSameDay(d, day))) {
                allPtoDays.push(day);
            }
        });

        // Si no hay días PTO, no hay días efectivos
        if (allPtoDays.length === 0) {
            return { effective: 0, ratio: 0 };
        }

        // Crear un mapa con todos los días libres (fines de semana, festivos y PTO)
        const freeDaysMap = new Map();

        // Añadir fines de semana
        monthsToShow.forEach(month => {
            eachDayOfInterval({
                start: startOfMonth(month),
                end: endOfMonth(month)
            }).forEach(day => {
                if (isWeekend(day)) {
                    freeDaysMap.set(format(day, 'yyyy-MM-dd'), day);
                }
            });
        });

        // Añadir festivos
        holidays.forEach(holiday => {
            freeDaysMap.set(format(holiday.date, 'yyyy-MM-dd'), holiday.date);
        });

        // Añadir días PTO
        allPtoDays.forEach(day => {
            freeDaysMap.set(format(day, 'yyyy-MM-dd'), day);
        });

        // Identificar secuencias de días libres consecutivos
        const freeDays = Array.from(freeDaysMap.values())
            .sort((a, b) => a.getTime() - b.getTime());

        const sequences = [];
        let currentSequence = [];

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

        // No olvidar la última secuencia
        if (currentSequence.length >= 1) {
            sequences.push(currentSequence);
        }

        // Calcular el valor efectivo contando días en secuencias que incluyen al menos un día PTO
        let effectiveDays = 0;

        sequences.forEach(sequence => {
            // Solo considerar secuencias que tengan al menos un día PTO
            const hasAnyPtoDay = sequence.some(day =>
                allPtoDays.some(ptoDay => isSameDay(day, ptoDay))
            );

            if (hasAnyPtoDay) {
                // Para secuencias que incluyen días PTO, contar la longitud
                effectiveDays += sequence.length;
            }
        });

        // Calcular ratio (días efectivos / días PTO)
        const ratio = (effectiveDays / allPtoDays.length).toFixed(1);

        return { effective: effectiveDays, ratio };
    }, [selectedPtoDays, holidays, monthsToShow]);

    // ALGORITMO MEJORADO PARA MAXIMIZAR DÍAS CONSECUTIVOS Y OPTIMIZAR BLOQUES
    const findOptimalGaps = useCallback(() => {
        const remainingPtoDays = availablePtoDays - selectedPtoDays.length;
        if (remainingPtoDays <= 0) return {
            suggestedDays: [],
            alternativeBlocks: {},
            dayToBlockIdMap: {}
        };

        // Fecha actual para filtrar días pasados
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Crear mapa de todos los días relevantes
        const yearMap = new Map();
        let allDays = [];

        // Incluir todos los meses a mostrar, incluido enero del año siguiente
        monthsToShow.forEach(month => {
            const daysInMonth = eachDayOfInterval({
                start: startOfMonth(month),
                end: endOfMonth(month)
            });
            allDays.push(...daysInMonth);
        });

        // Filtrar días pasados si no se permiten
        if (!allowPastDays) {
            allDays = allDays.filter(day => day >= today);
        }

        // Mapear información de cada día
        allDays.forEach(day => {
            const isWeekendDay = isWeekend(day);
            const isHolidayDay = isHoliday(day);
            const isAlreadySelected = selectedDays.some(selectedDay =>
                !isWeekend(selectedDay) && !isHoliday(selectedDay) && isSameDay(selectedDay, day)
            );

            yearMap.set(format(day, 'yyyy-MM-dd'), {
                date: day,
                isWeekend: isWeekendDay,
                isHoliday: isHolidayDay,
                isSelected: isAlreadySelected,
                isFreeDay: isWeekendDay || isHolidayDay || isAlreadySelected,
                month: getMonth(day)
            });
        });

        // ESTRATEGIA 1: ENCONTRAR BLOQUES ÓPTIMOS DE DÍAS
        const blockOpportunities = [];

        // Evaluar bloques de diferentes tamaños (1-5 días)
        allDays.forEach(startDay => {
            const startDayKey = format(startDay, 'yyyy-MM-dd');
            const startDayInfo = yearMap.get(startDayKey);

            // Saltarse días que ya son libres o no están en el mapa
            if (!startDayInfo || startDayInfo.isFreeDay) return;

            // Probar bloques de diferentes tamaños (1-5 días)
            for (let blockSize = 1; blockSize <= Math.min(5, remainingPtoDays); blockSize++) {
                // Verificar si podemos formar un bloque válido
                let validBlock = true;
                const blockDays = [startDay];

                // Añadir los días siguientes al bloque
                for (let i = 1; i < blockSize; i++) {
                    const nextDay = addDays(startDay, i);
                    const nextDayKey = format(nextDay, 'yyyy-MM-dd');
                    const nextDayInfo = yearMap.get(nextDayKey);

                    // Si el día está fuera del rango o ya es libre, no es un bloque válido
                    if (!nextDayInfo || nextDayInfo.isFreeDay) {
                        validBlock = false;
                        break;
                    }

                    blockDays.push(nextDay);
                }

                if (!validBlock) continue;

                // Calcular días libres consecutivos antes y después del bloque
                let daysBeforeBlock = 0;
                for (let i = 1; i <= 14; i++) {
                    const dayBefore = addDays(startDay, -i);
                    const dayBeforeKey = format(dayBefore, 'yyyy-MM-dd');
                    const dayInfo = yearMap.get(dayBeforeKey);

                    if (dayInfo && dayInfo.isFreeDay) {
                        daysBeforeBlock++;
                    } else {
                        break;
                    }
                }

                let daysAfterBlock = 0;
                for (let i = 1; i <= 14; i++) {
                    const dayAfter = addDays(startDay, blockSize - 1 + i);
                    const dayAfterKey = format(dayAfter, 'yyyy-MM-dd');
                    const dayInfo = yearMap.get(dayAfterKey);

                    if (dayInfo && dayInfo.isFreeDay) {
                        daysAfterBlock++;
                    } else {
                        break;
                    }
                }

                // Calcular valor del bloque
                const totalConsecutiveDays = daysBeforeBlock + blockSize + daysAfterBlock;

                // Calcular eficiencia (cuántos días totales se consiguen por día invertido)
                const efficiencyRatio = totalConsecutiveDays / blockSize;

                // La puntuación base es la eficiencia multiplicada por los días totales
                // Esto favorece bloques que generan muchos días consecutivos con la menor inversión
                let score = efficiencyRatio * totalConsecutiveDays;

                // Bonus por longitud del bloque total (favorece vacaciones largas)
                if (totalConsecutiveDays >= 7) {
                    score *= 1.5; // 50% extra para bloques que generan semanas completas o más
                } else if (totalConsecutiveDays >= 4) {
                    score *= 1.3; // 30% extra para bloques de 4+ días
                }

                // Super bonus para bloques de varios días PTO consecutivos
                if (blockSize >= 3) {
                    score *= 1.4; // 40% extra por bloques de 3+ días PTO consecutivos
                } else if (blockSize >= 2) {
                    score *= 1.2; // 20% extra por bloques de 2 días PTO consecutivos
                }

                // Analizar posición estratégica de los días en el bloque
                blockDays.forEach(day => {
                    // Verificar si es un día estratégico (adyacente a festivo/fin de semana)

                    // Día antes de fin de semana (viernes) o después (lunes)
                    if (day.getDay() === 5 || day.getDay() === 1) {
                        score *= 1.3; // 30% extra
                    }

                    // Comprobar adyacencia a fines de semana
                    const dayBefore = addDays(day, -1);
                    const dayAfter = addDays(day, 1);

                    // Situación de "puente" (día rodeado de festivos/fines de semana)
                    if ((isHoliday(dayBefore) || isWeekend(dayBefore)) &&
                        (isHoliday(dayAfter) || isWeekend(dayAfter))) {
                        score *= 1.5; // 50% extra por ser un puente (muy eficiente)
                    }
                    // Día adyacente a fin de semana o festivo
                    else if ((isHoliday(dayBefore) || isWeekend(dayBefore)) ||
                        (isHoliday(dayAfter) || isWeekend(dayAfter))) {
                        score *= 1.2; // 20% extra por extender un período libre
                    }
                });

                // Bonus por la densidad de festivos en el período
                let holidaysInPeriod = 0;

                // Contar festivos en el período (incluye días anteriores y posteriores)
                const blockStart = addDays(startDay, -daysBeforeBlock);
                const blockEnd = addDays(startDay, blockSize - 1 + daysAfterBlock);

                holidays.forEach(holiday => {
                    if (holiday.date >= blockStart && holiday.date <= blockEnd) {
                        holidaysInPeriod++;
                    }
                });

                // Bonus por densidad de festivos (favorece períodos con muchos festivos)
                if (holidaysInPeriod > 0) {
                    score *= (1 + (holidaysInPeriod * 0.1)); // 10% extra por cada festivo
                }

                // El nuevo cálculo ya es preciso, así que sólo necesitamos llamarlo directamente
                const effectiveDaysResult = calculateEffectiveDays(blockDays);
                const effectiveDays = effectiveDaysResult.effective;

                // Añadir oportunidad a la lista de bloques
                blockOpportunities.push({
                    startDay,
                    days: blockDays,
                    blockSize,
                    daysBeforeBlock,
                    daysAfterBlock,
                    totalConsecutiveDays,
                    score,
                    month: getMonth(startDay),
                    effectiveDays
                });
            }
        });

        // Ordenar oportunidades por puntuación
        blockOpportunities.sort((a, b) => b.score - a.score);

        // SELECCIÓN GREEDY DE LOS MEJORES BLOQUES
        const selectedBlocks = [];
        const finalSuggestedDays = [];
        let daysRemaining = remainingPtoDays;
        const alternativesByBlockId = {};
        const newDayToBlockIdMap = {};
        let blockIdCounter = 0;

        // Función para verificar si podemos añadir un bloque (sin conflictos)
        const canAddBlock = (blockDays) => {
            // Verificar que tenemos suficientes días PTO
            if (blockDays.length > daysRemaining) return false;

            // Verificar que ningún día ya ha sido seleccionado
            for (const day of blockDays) {
                // Comprobar si este día ya está en la selección
                if (finalSuggestedDays.some(selectedDay => isSameDay(selectedDay, day))) {
                    return false;
                }
            }
            return true;
        };

        // Función para obtener un identificador único para un bloque
        const getBlockId = () => {
            blockIdCounter++;
            return `block_${blockIdCounter}`;
        };

        // Seleccionar mejores bloques mientras tengamos días disponibles
        for (let i = 0; i < blockOpportunities.length; i++) {
            if (daysRemaining <= 0) break;

            const block = blockOpportunities[i];

            if (canAddBlock(block.days)) {
                // Generar un ID único para este bloque
                const blockId = getBlockId();

                // Añadir a bloques seleccionados
                selectedBlocks.push({...block, id: blockId});
                finalSuggestedDays.push(...block.days);
                daysRemaining -= block.days.length;

                // Actualizar el mapeo de días a ID de bloque
                block.days.forEach(day => {
                    newDayToBlockIdMap[format(day, 'yyyy-MM-dd')] = blockId;
                });

                // Buscar alternativas similares - Algoritmo mejorado con mayor precisión para festivos
                const alternativesForThisBlock = [];
                const blockDaysSet = new Set(block.days.map(d => format(d, 'yyyy-MM-dd')));

                // Obtener los días efectivos del bloque actual como referencia
                const effectiveDaysResult = calculateEffectiveDays(block.days);
                const effectiveDaysTarget = effectiveDaysResult.effective;

                // Recorrer todos los bloques potenciales
                const blockFreeDays = new Map();

// Añadir los días PTO del bloque
                block.days.forEach(day => {
                    blockFreeDays.set(format(day, 'yyyy-MM-dd'), true);
                });

// Añadir días antes y después hasta encontrar un día laborable
                let searchDate = addDays(block.days[0], -1);
                while (isWeekend(searchDate) || isHoliday(searchDate)) {
                    blockFreeDays.set(format(searchDate, 'yyyy-MM-dd'), true);
                    searchDate = addDays(searchDate, -1);
                }

                searchDate = addDays(block.days[block.days.length - 1], 1);
                while (isWeekend(searchDate) || isHoliday(searchDate)) {
                    blockFreeDays.set(format(searchDate, 'yyyy-MM-dd'), true);
                    searchDate = addDays(searchDate, 1);
                }

// Contar cuántos festivos hay en este período
                let holidaysInBlock = 0;
                holidays.forEach(holiday => {
                    const holidayKey = format(holiday.date, 'yyyy-MM-dd');
                    if (blockFreeDays.has(holidayKey)) {
                        holidaysInBlock++;
                    }
                });

// Modificar el criterio según si hay festivos o no
                const isMoreStrict = holidaysInBlock > 0;
                const allowedDifference = isMoreStrict ? 0 : 1; // Si hay festivos, exigimos exactitud

// Recorrer todos los bloques potenciales
                for (let j = 0; j < blockOpportunities.length; j++) {
                    if (i === j) continue; // No considerar el mismo bloque

                    const candidate = blockOpportunities[j];

                    // Paso 1: Debe tener el mismo número de días PTO
                    if (candidate.blockSize !== block.blockSize) continue;

                    // Paso 2: Verificar que no tenga conflictos con días ya seleccionados
                    let hasConflict = false;
                    for (const day of candidate.days) {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        if (finalSuggestedDays.some(d => isSameDay(d, day)) && !blockDaysSet.has(dayKey)) {
                            hasConflict = true;
                            break;
                        }
                    }
                    if (hasConflict) continue;

                    // Paso 3: Verificar que genere la misma cantidad de días libres consecutivos
                    const candidateEffectiveDays = calculateEffectiveDays(candidate.days).effective;

                    // Si hay festivos en el bloque, exigimos exactitud total en los días efectivos
                    if (Math.abs(candidateEffectiveDays - effectiveDaysTarget) > allowedDifference) {
                        continue;
                    }

                    // Si hay festivos y somos estrictos, verificar también que el candidato tenga festivos
                    if (isMoreStrict) {
                        // Verificar que el candidato también incluya/genere festivos
                        const candidateFreeDays = new Map();

                        // Añadir los días PTO del candidato
                        candidate.days.forEach(day => {
                            candidateFreeDays.set(format(day, 'yyyy-MM-dd'), true);
                        });

                        // Añadir días antes y después hasta encontrar un día laborable
                        let searchDate = addDays(candidate.days[0], -1);
                        while (isWeekend(searchDate) || isHoliday(searchDate)) {
                            candidateFreeDays.set(format(searchDate, 'yyyy-MM-dd'), true);
                            searchDate = addDays(searchDate, -1);
                        }

                        searchDate = addDays(candidate.days[candidate.days.length - 1], 1);
                        while (isWeekend(searchDate) || isHoliday(searchDate)) {
                            candidateFreeDays.set(format(searchDate, 'yyyy-MM-dd'), true);
                            searchDate = addDays(searchDate, 1);
                        }

                        // Contar cuántos festivos hay en este período candidato
                        let holidaysInCandidate = 0;
                        holidays.forEach(holiday => {
                            const holidayKey = format(holiday.date, 'yyyy-MM-dd');
                            if (candidateFreeDays.has(holidayKey)) {
                                holidaysInCandidate++;
                            }
                        });

                        // Si los días de festivo no coinciden, no es una buena alternativa
                        if (holidaysInCandidate !== holidaysInBlock) {
                            continue;
                        }
                    }

                    // Si llegamos aquí, tenemos una alternativa válida
                    alternativesForThisBlock.push(candidate);

                    // Limitar el número de alternativas para evitar sobrecarga
                    if (alternativesForThisBlock.length >= 5) break;
                }

                // Almacenar las alternativas para este bloque (incluso si está vacío)
                alternativesByBlockId[blockId] = alternativesForThisBlock;

                // Actualizar mapa de días (marcar como ocupados)
                block.days.forEach(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayInfo = yearMap.get(dayKey);
                    if (dayInfo) {
                        yearMap.set(dayKey, {...dayInfo, isFreeDay: true});
                    }
                });
            }
        }

        return {
            suggestedDays: finalSuggestedDays,
            alternativeBlocks: alternativesByBlockId,
            dayToBlockIdMap: newDayToBlockIdMap
        };
    }, [monthsToShow, selectedDays, availablePtoDays, selectedPtoDays.length, isHoliday, holidays, allowPastDays, calculateEffectiveDays]);

    // Actualizar sugerencias cuando cambian los parámetros relevantes
    useEffect(() => {
        const remainingDays = availablePtoDays - selectedPtoDays.length;

        if (remainingDays <= 0) {
            setSuggestedDays([]);
            setAlternativeBlocks({});
            setDayToBlockIdMap({});
            setOptimizationSummary(`Has utilizado todos tus ${availablePtoDays} días PTO disponibles.`);
            setEffectiveDaysData(calculateEffectiveDays([]));
            return;
        }

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

        // Generar resumen de la optimización
        if (optimal.length > 0) {
            // Agrupar por mes para el resumen
            const monthCounts = {};
            optimal.forEach(day => {
                const monthYear = format(day, 'MMMM yyyy', { locale: es });
                monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
            });

            const summaryParts = Object.entries(monthCounts).map(
                ([month, count]) => `${count} días en ${month}`
            );

            setOptimizationSummary(
                `¡Con tus ${availablePtoDays} días PTO conseguirás ${effectiveData.effective} días totales de vacaciones! ` +
                `(ratio ${effectiveData.ratio}x). Sugerencia: ${optimal.length} días distribuidos estratégicamente (${summaryParts.join(', ')})`
            );
        } else {
            setOptimizationSummary(
                `Tienes ${remainingDays} días PTO disponibles para asignar.`
            );
        }
    }, [availablePtoDays, selectedPtoDays.length, findOptimalGaps, calculateEffectiveDays]);

    // Handlers para hover usando data attributes - optimizado con mouseOver/mouseOut que son más estables
    const handleDayMouseOver = useCallback((e) => {
        const button = e.currentTarget;
        const isSuggested = button.dataset.suggested === "true";

        if (!isSuggested) return;

        const blockId = button.dataset.blockId;
        if (blockId && alternativeBlocks[blockId]) {
            setHoveredBlockId(blockId);
        }
    }, [alternativeBlocks]);

    const handleDayMouseOut = useCallback((e) => {
        setHoveredBlockId(null);
    }, []);

    // Verificar si un día está sugerido
    const isDaySuggested = useCallback((day) =>
            suggestedDays.some(d => isSameDay(d, day)),
        [suggestedDays]);

    // Verificar si un día es una alternativa (usando el blockId actual)
    const isDayAlternative = useCallback((day) => {
        if (!hoveredBlockId || suggestedDays.some(d => isSameDay(d, day))) {
            return false;
        }

        // Buscar en las alternativas del bloque actual
        const alternatives = alternativeBlocks[hoveredBlockId] || [];
        return alternatives.some(block =>
            block.days && block.days.some(d => isSameDay(d, day))
        );
    }, [hoveredBlockId, suggestedDays, alternativeBlocks]);

    const getDayClassName = useCallback((date, displayMonth) => {
        const classes = ["h-8 w-8 p-0 font-normal"];

        // Día pasado (no seleccionable si no está permitido)
        if (!allowPastDays && date < new Date() && !selectedDays.some(d => isSameDay(d, date))) {
            classes.push("opacity-50 cursor-not-allowed");
        }

        // Aplicar estilos según el tipo de día
        if (isWeekend(date)) classes.push("bg-slate-100 text-slate-500");
        if (isHoliday(date)) classes.push("bg-yellow-100 text-yellow-800");
        if (isToday(date)) classes.push("ring-2 ring-blue-400");
        if (isDaySuggested(date)) classes.push("border-2 border-green-500");
        if (isDayAlternative(date)) classes.push("border-2 border-purple-500");
        if (!isSameMonth(date, displayMonth)) classes.push("opacity-0 invisible");

        // Día seleccionado (fines de semana, festivos o días PTO)
        if (selectedDays.some(d => isSameDay(d, date))) {
            if (!isWeekend(date) && !isHoliday(date)) {
                classes.push("bg-blue-500 text-white hover:bg-blue-600");
            }
        }

        return classes.join(" ");
    }, [isHoliday, isDaySuggested, isDayAlternative, selectedDays, allowPastDays]);

    // Manejar selección de días
    const handleDaySelect = useCallback((date) => {
        if (!date) return;

        // No permitir seleccionar fines de semana o festivos
        if (isWeekend(date) || isHoliday(date)) {
            return;
        }

        // No permitir seleccionar días pasados si no está habilitada la opción
        if (!allowPastDays && date < new Date()) {
            alert("No puedes seleccionar días pasados. Activa la opción 'Permitir seleccionar días pasados' si lo deseas.");
            return;
        }

        setSelectedDays(prev => {
            const isSelected = prev.some(d => isSameDay(d, date));

            if (isSelected) {
                // Quitar el día
                return prev.filter(d => !isSameDay(d, date));
            } else {
                // Verificar si excede el límite de días PTO
                const currentPtoDays = prev.filter(d => !isWeekend(d) && !isHoliday(d)).length;

                if (currentPtoDays >= availablePtoDays) {
                    alert(`No puedes seleccionar más de ${availablePtoDays} días PTO. Quita algún día para poder seleccionar otros.`);
                    return prev;
                }

                // Añadir el día
                return [...prev, date];
            }
        });
    }, [isHoliday, availablePtoDays, allowPastDays]);

    // Handlers para cambios de configuración
    const handleAvailableDaysChange = useCallback((e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0) {
            setAvailablePtoDays(value);
        }
    }, []);

    const handleCountryChange = useCallback((value) => {
        setSelectedCountry(value);
        setSelectedRegion(null);
        // Reset región cuando cambia el país
 // fetch regions for country
    }, []);

    const handleRegionChange = useCallback((value) => {
        setSelectedRegion(value);
    }, []);

    const handleYearChange = useCallback((value) => {
        setYear(parseInt(value, 10));
    }, []);

    // Obtener días sugeridos para un mes específico
    const getSuggestedDaysForMonth = useCallback((month) => {
        return suggestedDays.filter(day => isSameMonth(day, month));
    }, [suggestedDays]);

    // Generar resumen de sugerencias para un mes como intervalos
    const getMonthSummary = useCallback((month) => {
        const suggestedInMonth = getSuggestedDaysForMonth(month);

        if (suggestedInMonth.length === 0) {
            return null;
        }

        // Ordenar días por fecha
        const sortedDays = [...suggestedInMonth].sort((a, b) => a.getTime() - b.getTime());

        // Agrupar en intervalos
        const intervals = [];
        let currentInterval = [];

        if (sortedDays.length > 0) {
            currentInterval = [sortedDays[0]];

            for (let i = 1; i < sortedDays.length; i++) {
                const prevDay = sortedDays[i - 1];
                const currentDay = sortedDays[i];

                // Si es consecutivo, añadir al intervalo actual
                if (differenceInDays(currentDay, prevDay) === 1) {
                    currentInterval.push(currentDay);
                } else {
                    // Si no es consecutivo, cerrar el intervalo actual y empezar uno nuevo
                    intervals.push([...currentInterval]);
                    currentInterval = [currentDay];
                }
            }

            // No olvidar el último intervalo
            if (currentInterval.length > 0) {
                intervals.push(currentInterval);
            }
        }

        // Calcular los días libres totales para cada intervalo
        const intervalsWithTotalDays = intervals.map(interval => {
            // Primero, encontrar el primer y último día del intervalo
            const firstPtoDay = interval[0];
            const lastPtoDay = interval[interval.length - 1];

            // Crear un mapa con todos los días libres (incluyendo los seleccionados, los del intervalo, festivos y fines de semana)
            const allFreeDays = new Map();

            // Añadir días PTO ya seleccionados
            selectedDays.forEach(day => {
                if (!isWeekend(day) && !isHoliday(day)) {
                    allFreeDays.set(format(day, 'yyyy-MM-dd'), day);
                }
            });

            // Añadir días del intervalo
            interval.forEach(day => {
                allFreeDays.set(format(day, 'yyyy-MM-dd'), day);
            });

            // Añadir festivos
            holidays.forEach(holiday => {
                allFreeDays.set(format(holiday.date, 'yyyy-MM-dd'), holiday.date);
            });

            // Añadir fines de semana en el rango relevante
            // Buscar desde 14 días antes del primer día hasta 14 días después del último día
            const searchStart = addDays(firstPtoDay, -14);
            const searchEnd = addDays(lastPtoDay, 14);

            eachDayOfInterval({ start: searchStart, end: searchEnd }).forEach(day => {
                if (isWeekend(day)) {
                    allFreeDays.set(format(day, 'yyyy-MM-dd'), day);
                }
            });

            // Encontrar el bloque continuo que contiene el intervalo
            let startPoint = firstPtoDay;
            let endPoint = lastPtoDay;

            // Buscar días libres consecutivos hacia atrás
            let searching = true;
            while (searching) {
                const prevDay = addDays(startPoint, -1);
                const prevDayKey = format(prevDay, 'yyyy-MM-dd');

                if (allFreeDays.has(prevDayKey)) {
                    startPoint = prevDay;
                } else {
                    searching = false;
                }
            }

            // Buscar días libres consecutivos hacia adelante
            searching = true;
            while (searching) {
                const nextDay = addDays(endPoint, 1);
                const nextDayKey = format(nextDay, 'yyyy-MM-dd');

                if (allFreeDays.has(nextDayKey)) {
                    endPoint = nextDay;
                } else {
                    searching = false;
                }
            }

            // Contar días en el bloque continuo
            const daysInInterval = differenceInDays(endPoint, startPoint) + 1;

            return {
                interval,
                ptoDays: interval.length,
                totalFreeDays: daysInInterval,
                startDate: startPoint,
                endDate: endPoint
            };
        });

        // Formatear los intervalos
        const formattedIntervals = intervalsWithTotalDays.map(({ interval, ptoDays, totalFreeDays, startDate, endDate }) => {
            const start = interval[0];
            const end = interval[interval.length - 1];

            let text = '';
            if (interval.length === 1) {
                // Un solo día
                text = `${getDate(start)} de ${format(start, "MMMM", { locale: es })}: 1 día.`;
            } else {
                // Intervalo de días
                text = `${getDate(start)} al ${getDate(end)} de ${format(start, "MMMM", { locale: es })}: ${ptoDays} días.`;
            }

            return {
                text,
                totalDays: totalFreeDays
            };
        });

        return (
            <div className="text-xs mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700">
                <p className="font-semibold mb-1">Sugerencia:</p>
                {formattedIntervals.map(({ text, totalDays }, idx) => (
                    <p key={idx} className={totalDays >= 7 ? "font-semibold" : ""}>{text}</p>
                ))}

                <div className="mt-2 text-xs text-gray-600">
                    <p>Pasa el cursor sobre un día sugerido <br/> para ver alternativas similares.</p>
                </div>
            </div>
        );
    }, [suggestedDays, getSuggestedDaysForMonth, isHoliday, selectedDays, holidays]);

    return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-4 gap-8 sm:p-8">
            <header className="w-full flex flex-col gap-4 mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold">Optimizador de PTO</h1>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Badge variant="outline">
                            Días PTO seleccionados: {selectedPtoDays.length}/{availablePtoDays}
                        </Badge>
                        {effectiveDaysData.effective > 0 && (
                            <Badge variant="secondary" className="bg-green-100">
                                Días efectivos: {effectiveDaysData.effective} (x{effectiveDaysData.ratio})
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="available-days" className="whitespace-nowrap">
                            Tengo
                        </Label>
                        <Input
                            id="available-days"
                            type="number"
                            value={availablePtoDays}
                            onChange={handleAvailableDaysChange}
                            className="w-20"
                            min="0"
                        />
                        <span>días libres</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Combobox
                            value={selectedCountry}
                            onChange={handleCountryChange}
                            options={countryOptions}
                            label="País"
                            placeholder="Selecciona país..."
                            searchPlaceholder="Buscar país..."
                            notFoundText="País no encontrado."
                        />
                        <p className="text-xs text-gray-500">inferred from your IP. Feel free to change it or</p>
                    </div>

                    {selectedRegion && (
                        <div className="flex items-center gap-2">
                            <Combobox
                                value={selectedRegion}
                                onChange={handleRegionChange}
                                options={regionsInSpain}
                                label="Región"
                                placeholder="Selecciona region..."
                                searchPlaceholder="Buscar region..."
                                notFoundText="Region no encontrada."
                            />
                            <p className="text-xs text-gray-500">inferred from your IP. Feel free to change it or</p>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Label htmlFor="year-select" className="whitespace-nowrap">
                            Año:
                        </Label>
                        <Select value={year} onValueChange={handleYearChange}>
                            <SelectTrigger id="year-select" className="w-24">
                                <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={2024}>2024</SelectItem>
                                <SelectItem value={2025}>2025</SelectItem>
                                <SelectItem value={2026}>2026</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded">
                    <Checkbox
                        id="allow-past-days"
                        checked={allowPastDays}
                        onCheckedChange={(checked) => setAllowPastDays(checked === true)}
                    />
                    <Label
                        htmlFor="allow-past-days"
                        className="text-sm cursor-pointer"
                    >
                        Permitir seleccionar días pasados
                    </Label>
                </div>

                {optimizationSummary && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                        <p className="text-sm">{optimizationSummary}</p>
                    </div>
                )}
            </header>

            <main className="flex flex-col gap-8 items-center w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {monthsToShow.map((month) => (
                        <Card key={month.toISOString()} className="mb-4">
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
                                                    data-suggested={isSuggested ? "true" : "false"}
                                                    data-block-id={blockId}
                                                    data-date={dateKey}
                                                    onMouseOver={handleDayMouseOver}
                                                    onMouseOut={handleDayMouseOut}
                                                >
                                                    {date.getDate()}
                                                </button>
                                            </div>
                                        );
                                    }
                                }}
                            />
                            {getMonthSummary(month)}
                        </Card>
                    ))}
                </div>
            </main>

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
        </div>
    );
}
// TODO:
// 1- Refactor
// 2- Isolate functions
// 4- Tema fin de semana
// 5- Revisar seleccion i ratio
// 6- Add tests
// 7- Add eslint, prettierc, and tools prehook
// 8- Add dependabot/ Renovate
// 9- Add CI/CD
// 10- Get Country, region and holidays by IP
// 12- SSR + URL state (use startTransition as well)
// 13- Next Config + TS Config
// 14- i18n
// 15- dark mode
// 17- Allow user to hide festivities (or add them)
// 18- Allow user to change weekends
// 19- change forEach to for...of
// 23- Adjust threshold (paid funcionality)
// 24- Edit weekends (paid functionality)
// 25- Edit festivities (paid functionality)