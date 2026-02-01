export interface PtoCalculationParams {
  totalBudget: number;
  currentSelectionDays: Date[];
  manuallySelectedDays: Date[];
  removedSuggestedDays: Date[];
}

export class PtoCalculator {
  private getActiveDaysCount(params: PtoCalculationParams): {
    activeSuggestedCount: number;
    manualSelectedCount: number;
  } {
    const { currentSelectionDays, removedSuggestedDays, manuallySelectedDays } = params;

    const activeSuggestedCount = currentSelectionDays.length - removedSuggestedDays.length;
    const manualSelectedCount = manuallySelectedDays.length;

    return { activeSuggestedCount, manualSelectedCount };
  }

  canSelectDay(params: PtoCalculationParams): boolean {
    const { totalBudget } = params;
    const { activeSuggestedCount, manualSelectedCount } = this.getActiveDaysCount(params);

    const totalUsed = activeSuggestedCount + manualSelectedCount;
    return totalUsed < totalBudget;
  }

  getRemainingDays(params: PtoCalculationParams): number {
    const { totalBudget } = params;
    const { activeSuggestedCount, manualSelectedCount } = this.getActiveDaysCount(params);

    const totalUsed = activeSuggestedCount + manualSelectedCount;
    return Math.max(0, totalBudget - totalUsed);
  }

  getTotalUsedDays(params: PtoCalculationParams): number {
    const { activeSuggestedCount, manualSelectedCount } = this.getActiveDaysCount(params);
    return activeSuggestedCount + manualSelectedCount;
  }
}
