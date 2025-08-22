import { PTO_CONSTANTS } from '../const';
import { Bridge } from '../types';
import { getKey } from './cache';

export const selectOptimalDaysFromBridges = (
  bridges: Bridge[],
  targetPtoDays: number
): { days: Date[]; totalEffectiveDays: number; bridges: Bridge[] } => {
  // Estrategia mejorada: Considera tanto eficiencia como valor total
  const scoredBridges = bridges.map((bridge) => {
    // Calcular un score que balance eficiencia y días totales
    // Penalizar ligeramente los puentes de muchos días para no ignorar oportunidades grandes
    const efficiencyScore = bridge.efficiency;
    const valueScore = bridge.effectiveDays / 10; // Normalizar a escala similar

    // Para puentes de 3+ días con alta ganancia total, dar bonus
    const multiDayBonus = bridge.ptoDaysNeeded >= 3 && bridge.effectiveDays >= 9 ? 1.5 : 1;

    const totalScore = (efficiencyScore * 0.6 + valueScore * 0.4) * multiDayBonus;

    return {
      ...bridge,
      score: totalScore,
    };
  });

  // Ordenar por score compuesto
  scoredBridges.sort((a, b) => b.score - a.score);

  // Ahora seleccionar usando un algoritmo más inteligente
  const selectedBridges = selectOptimalCombination(scoredBridges, targetPtoDays);

  const selectedDays = selectedBridges.flatMap((bridge) => bridge.ptoDays);
  const totalEffectiveDays = selectedBridges.reduce((sum, b) => sum + b.effectiveDays, 0);

  return {
    days: selectedDays.sort((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays,
    bridges: selectedBridges,
  };
};

type ScoredBridge = Bridge & { score: number };

function selectOptimalCombination(scoredBridges: ScoredBridge[], targetPtoDays: number): Bridge[] {
  // Implementar una selección más inteligente que considere:
  // 1. Primero intentar incluir los puentes de mayor valor
  // 2. Luego rellenar con puentes eficientes más pequeños

  const selectedBridges: Bridge[] = [];
  const usedDates = new Set<string>();
  let totalPtoDays = 0;

  // FASE 1: Incluir puentes de alto valor (3+ días con 9+ días efectivos)
  const highValueBridges = scoredBridges.filter(
    (b) => b.ptoDaysNeeded >= 3 && b.effectiveDays >= 9 && b.efficiency >= PTO_CONSTANTS.EFFICIENCY.ACCEPTABLE
  );

  for (const bridge of highValueBridges) {
    if (totalPtoDays + bridge.ptoDaysNeeded > targetPtoDays) continue;

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

    if (!hasConflict) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
      totalPtoDays += bridge.ptoDaysNeeded;

      if (totalPtoDays >= targetPtoDays) break;
    }
  }

  // FASE 2: Rellenar con puentes eficientes más pequeños
  if (totalPtoDays < targetPtoDays) {
    const remainingBridges = scoredBridges.filter((b) => !highValueBridges.includes(b));

    for (const bridge of remainingBridges) {
      if (totalPtoDays >= targetPtoDays) break;

      const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

      if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
        selectedBridges.push(bridge);
        bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
        totalPtoDays += bridge.ptoDaysNeeded;
      }
    }
  }

  // FASE 3: Si aún faltan días, rellenar con los mejores días individuales disponibles
  if (totalPtoDays < targetPtoDays) {
    const singleDayBridges = scoredBridges.filter((b) => b.ptoDaysNeeded === 1 && !usedDates.has(getKey(b.ptoDays[0])));

    for (const bridge of singleDayBridges) {
      if (totalPtoDays >= targetPtoDays) break;

      selectedBridges.push(bridge);
      usedDates.add(getKey(bridge.ptoDays[0]));
      totalPtoDays++;
    }
  }

  return selectedBridges;
}

// También exportar una versión para estrategias específicas
export const selectBridgesForStrategy = (
  bridges: Bridge[],
  targetPtoDays: number,
  strategy: 'grouped' | 'optimized' | 'balanced'
): { days: Date[]; totalEffectiveDays: number; bridges: Bridge[] } => {
  let sortedBridges: Bridge[];

  switch (strategy) {
    case 'grouped':
      // Priorizar bloques grandes continuos
      sortedBridges = [...bridges].sort((a, b) => {
        // Primero por tamaño del bloque
        if (a.ptoDaysNeeded !== b.ptoDaysNeeded) {
          return b.ptoDaysNeeded - a.ptoDaysNeeded;
        }
        // Luego por eficiencia
        return b.efficiency - a.efficiency;
      });
      break;

    case 'optimized':
      // Pura eficiencia
      sortedBridges = [...bridges].sort((a, b) => {
        const effDiff = b.efficiency - a.efficiency;
        if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
          return effDiff;
        }
        return b.effectiveDays - a.effectiveDays;
      });
      break;

    case 'balanced':
    default:
      // Usar la estrategia mejorada con scoring
      return selectOptimalDaysFromBridges(bridges, targetPtoDays);
  }

  // Selección simple para grouped y optimized
  const selectedBridges: Bridge[] = [];
  const usedDates = new Set<string>();
  let totalPtoDays = 0;
  let totalEffectiveDays = 0;

  for (const bridge of sortedBridges) {
    if (totalPtoDays >= targetPtoDays) break;

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

    if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
      totalPtoDays += bridge.ptoDaysNeeded;
      totalEffectiveDays += bridge.effectiveDays;
    }
  }

  const selectedDays = selectedBridges.flatMap((bridge) => bridge.ptoDays);

  return {
    days: selectedDays.sort((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays,
    bridges: selectedBridges,
  };
};
