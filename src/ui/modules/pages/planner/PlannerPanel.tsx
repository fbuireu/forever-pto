'use client';

import { useFiltersStore } from '@application/stores/filters';
import type { HolidaysState } from '@application/stores/holidays';
import { useHolidaysStore } from '@application/stores/holidays';
import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import type { Suggestion } from '@domain/calendar/types';
import { ChevronLeft } from '@ui/modules/core/animate/icons/ChevronLeft';
import { ChevronRight } from '@ui/modules/core/animate/icons/ChevronRight';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';
import { Button } from '@ui/modules/core/primitives/Button';
import { Progress, ProgressOverlayLabel, ProgressTrack } from '@ui/modules/core/primitives/Progress';
import { cn } from '@ui/utils/cn';
import { BarChart3, CalendarDays, Sparkles, TrendingUp } from 'lucide-react';
import { m, type Transition, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

const STAT_CARD_MOTION_CONFIG = {
  initial: 'rest',
  whileHover: 'hover',
  whileTap: 'tap',
  variants: {
    rest: { maxWidth: '120px' },
    hover: {
      maxWidth: '200px',
      transition: { type: 'spring', stiffness: 200, damping: 35, delay: 0.15 },
    },
    tap: { scale: 0.95, maxWidth: '200px' },
  },
  transition: { type: 'spring', stiffness: 250, damping: 25 },
} as const;

const LABEL_VARIANTS: Variants = {
  rest: { opacity: 0, x: 4 },
  hover: { opacity: 1, x: 0, visibility: 'visible' },
  tap: { opacity: 1, x: 0, visibility: 'visible' },
};

const LABEL_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

const BADGE_VARIANTS: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20, delay: 0.2 },
  },
};

interface AlternativesProps {
  allSuggestions: Suggestion[];
  onSelectionChange: (params: AlternativeSelectionBaseParams) => void;
  onPreviewChange: (params: AlternativeSelectionBaseParams) => void;
  selectedIndex: number;
  currentSelectionIndex: number;
}

function Alternatives({
  allSuggestions,
  onSelectionChange,
  onPreviewChange,
  selectedIndex = 0,
  currentSelectionIndex = 0,
}: AlternativesProps) {
  const t = useTranslations('alternativesManager');
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const totalOptions = allSuggestions.length;
  const currentSuggestion = allSuggestions[currentIndex];

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onPreviewChange({ suggestion: allSuggestions[newIndex], index: newIndex });
    }
  }, [currentIndex, allSuggestions, onPreviewChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalOptions - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onPreviewChange({ suggestion: allSuggestions[newIndex], index: newIndex });
    }
  }, [currentIndex, totalOptions, allSuggestions, onPreviewChange]);

  const effectiveDays = currentSuggestion.metrics?.totalEffectiveDays ?? 0;
  const efficiency = currentSuggestion.metrics?.averageEfficiency ?? 0;
  const gainedDays = currentSuggestion.metrics?.bonusDays ?? 0;
  const mainEfficiency = allSuggestions[0]?.metrics?.averageEfficiency ?? 0;
  const efficiencyDiff = efficiency - mainEfficiency;
  const isMainSuggestion = currentIndex === 0;

  return (
    <div className='flex flex-wrap items-center gap-3' data-tutorial='alternatives-manager'>
      <div className='flex shrink-0 grow items-stretch overflow-hidden rounded-xl border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] shadow-[var(--shadow-brutal-xs)]'>
        <m.button
          type='button'
          whileTap={{ filter: 'brightness(0.85)' }}
          disabled={currentIndex === 0}
          onClick={handlePrevious}
          aria-label={t('previousSuggestion')}
          className='w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] hover:bg-[var(--accent)] hover:text-[var(--color-brand-ink)] transition-colors duration-75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none border-r-[3px] border-[var(--frame)]'
        >
          <ChevronLeft size={20} />
        </m.button>
        <div className='mx-2 flex grow flex-col items-center justify-center relative duration-300 ease-out py-2'>
          <div className='flex items-center gap-x-1 text-sm tabular-nums'>
            <span className='text-xs text-muted-foreground'>{t('option')}</span>
            <SlidingNumber className='text-base font-semibold text-foreground' padStart number={currentIndex + 1} />
            <span className='text-muted-foreground'>/ {totalOptions}</span>
          </div>
          {isMainSuggestion && (
            <m.span
              variants={BADGE_VARIANTS}
              initial='initial'
              animate='animate'
              className='mt-1 flex items-center gap-1 rounded-full border-[3px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-yellow)_28%,white_72%)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-brand-orange-deep)] shadow-[var(--shadow-brutal-xs)]'
            >
              <Sparkles size={8} />
              {t('recommended')}
            </m.span>
          )}
        </div>
        <m.button
          type='button'
          whileTap={{ filter: 'brightness(0.85)' }}
          disabled={currentIndex === totalOptions - 1}
          onClick={handleNext}
          aria-label={t('nextSuggestion')}
          className='w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] hover:bg-[var(--accent)] hover:text-[var(--color-brand-ink)] transition-colors duration-75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none border-l-[3px] border-[var(--frame)]'
        >
          <ChevronRight size={20} />
        </m.button>
      </div>

      <div className='hidden lg:block mx-1 h-9 w-[2px] bg-[var(--frame)]/15 rounded-full' />

      <m.div layout layoutRoot className='flex flex-col gap-2 sm:flex-row sm:flex-nowrap'>
        <m.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-11 items-center gap-x-2 overflow-hidden whitespace-nowrap rounded-[10px] border-[3px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-teal)_18%,white_82%)] px-3 py-2 shadow-[var(--shadow-brutal-xs)] dark:bg-[color-mix(in_srgb,var(--color-brand-teal)_16%,black_84%)]'
          aria-label={t('totalDaysOff')}
        >
          <CalendarDays size={20} className='text-green-600 dark:text-green-400 shrink-0' />
          <div className='flex items-center gap-1'>
            <SlidingNumber
              className='text-sm font-semibold text-green-700 dark:text-green-300'
              number={effectiveDays ?? 0}
            />
            <span className='text-xs text-green-600 dark:text-green-400 flex'>
              (+
              <SlidingNumber number={gainedDays} />)
            </span>
          </div>
          <m.span
            variants={LABEL_VARIANTS}
            transition={LABEL_TRANSITION}
            className='invisible text-sm text-green-600 dark:text-green-400'
          >
            {t('totalOff')}
          </m.span>
        </m.button>

        <m.button
          {...STAT_CARD_MOTION_CONFIG}
          className='flex h-11 items-center gap-x-2 overflow-hidden whitespace-nowrap rounded-[10px] border-[3px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,white_80%)] px-3 py-2 shadow-[var(--shadow-brutal-xs)] dark:bg-[color-mix(in_srgb,var(--color-brand-purple)_16%,black_84%)]'
          aria-label={t('efficiency')}
        >
          <TrendingUp size={20} className='text-purple-600 dark:text-purple-400 shrink-0' />
          <div className='flex items-center gap-1'>
            <SlidingNumber
              className='text-sm font-semibold text-purple-700 dark:text-purple-300'
              number={parseFloat(efficiency.toFixed(1))}
              decimalPlaces={1}
            />
            <span className='text-sm font-semibold text-purple-700 dark:text-purple-300'>x</span>
            {!isMainSuggestion && (
              <span
                className={cn(
                  'text-xs flex',
                  efficiencyDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {efficiencyDiff >= 0 ? '+' : ''}
                <SlidingNumber number={parseFloat(efficiencyDiff.toFixed(1))} decimalPlaces={1} />
              </span>
            )}
          </div>
          <m.span
            variants={LABEL_VARIANTS}
            transition={LABEL_TRANSITION}
            className='invisible text-sm text-purple-600 dark:text-purple-400'
          >
            {t('efficiency')}
          </m.span>
        </m.button>

        {!isMainSuggestion && (
          <m.button
            {...STAT_CARD_MOTION_CONFIG}
            className='flex h-11 items-center gap-x-2 overflow-hidden whitespace-nowrap rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel-soft)] px-3 py-2 shadow-[var(--shadow-brutal-xs)]'
            aria-label={t('comparison')}
          >
            <BarChart3 size={20} className='text-neutral-600 dark:text-neutral-400 shrink-0' />
            <div className='flex items-center gap-1'>
              <SlidingNumber
                className={cn(
                  'text-sm font-semibold',
                  efficiencyDiff >= -0.5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}
                number={Math.round((efficiency / mainEfficiency) * 100)}
              />
              <span
                className={cn(
                  'text-sm font-semibold',
                  efficiencyDiff >= -0.5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                %
              </span>
            </div>
            <m.span
              variants={LABEL_VARIANTS}
              transition={LABEL_TRANSITION}
              className='invisible text-sm text-neutral-600 dark:text-neutral-400'
            >
              {t('vsMain')}
            </m.span>
          </m.button>
        )}
      </m.div>

      <Button
        disabled={currentSelectionIndex === currentIndex}
        className='flex grow h-11 text-sm cursor-pointer items-center justify-center rounded-[10px] px-4 py-2 font-black transition-colors duration-300'
        onClick={() => onSelectionChange({ suggestion: currentSuggestion, index: currentIndex })}
      >
        {currentSelectionIndex === currentIndex ? t('alreadyApplied') : t('applyAlternative')}
      </Button>
    </div>
  );
}

interface StatusProps {
  currentSelection: NonNullable<HolidaysState['currentSelection']>;
}

function Status({ currentSelection }: StatusProps) {
  const t = useTranslations('ptoStatus');
  const resetManualSelection = useHolidaysStore((state) => state.resetManualSelection);
  const ptoDays = useFiltersStore((state) => state.ptoDays);
  const { removedSuggestedDays, manuallySelectedDays, isCalculating } = useHolidaysStore(
    useShallow((state) => ({
      removedSuggestedDays: state.removedSuggestedDays,
      manuallySelectedDays: state.manuallySelectedDays,
      isCalculating: state.isCalculating,
    }))
  );

  const activeSuggestedCount = currentSelection.days.length - removedSuggestedDays.length;
  const manualSelectedCount = manuallySelectedDays.length;
  const usedDays = activeSuggestedCount + manualSelectedCount;
  const rawRemaining = Math.max(0, ptoDays - activeSuggestedCount - manualSelectedCount);
  const lastSettledRemaining = useRef(rawRemaining);
  useEffect(() => {
    if (!isCalculating) lastSettledRemaining.current = rawRemaining;
  });
  const remaining = isCalculating ? lastSettledRemaining.current : rawRemaining;
  const hasManualChanges = manualSelectedCount > 0 || removedSuggestedDays.length > 0;
  const usedPct = ptoDays > 0 ? Math.min(100, Math.round((usedDays / ptoDays) * 100)) : 0;
  const remainingPct = Math.max(0, 100 - usedPct);

  return (
    <div className='pt-3' data-tutorial='pto-status'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4 flex-wrap gap-y-2'>
          <div className='flex items-center gap-2 rounded-[10px] border-[3px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-teal)_18%,white_82%)] dark:bg-[color-mix(in_srgb,var(--color-brand-teal)_25%,black_75%)] px-3 py-1 shadow-[var(--shadow-brutal-xs)]'>
            <div className='size-3 rounded-full bg-teal-500' />
            <span className='text-sm text-muted-foreground'>{t('autoAssigned')}:</span>
            <SlidingNumber
              number={activeSuggestedCount}
              className='font-display font-black text-teal-700 dark:text-teal-300'
            />
          </div>
          <div className='flex items-center gap-2 rounded-[10px] border-[3px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,white_82%)] dark:bg-[color-mix(in_srgb,var(--color-brand-purple)_25%,black_75%)] px-3 py-1 shadow-[var(--shadow-brutal-xs)]'>
            <div className='size-3 rounded-full bg-blue-500' />
            <span className='text-sm text-muted-foreground'>{t('manual')}:</span>
            <SlidingNumber
              number={manualSelectedCount}
              className='font-display font-black text-blue-700 dark:text-blue-300'
            />
          </div>
          <div className='h-8 w-[2px] bg-[var(--frame)]/15 hidden sm:block' />
          <div className='flex flex-col items-center rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel-alt)] px-3 py-1.5 shadow-[var(--shadow-brutal-xs)]'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-display font-black uppercase tracking-[0.08em]'>{t('remaining')}:</span>
              <SlidingNumber
                number={remaining}
                className={cn(
                  'font-display font-black',
                  remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}
              />
            </div>
            {remaining === 0 && !hasManualChanges && (
              <span className='text-[10px] text-green-700 dark:text-green-400 font-medium'>✓ {t('allAssigned')}</span>
            )}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={resetManualSelection}
            type='button'
            className={cn('text-xs', !hasManualChanges && 'invisible pointer-events-none')}
          >
            {t('resetManual')}
          </Button>
        </div>
      </div>
      <div className='mt-3 space-y-2'>
        <Progress value={usedPct === 100 ? 100 : usedPct}>
          <div className='relative h-[22px]'>
            <ProgressTrack
              className='h-[22px] rounded-full bg-background shadow-[var(--shadow-brutal-3)] flex items-center'
              indicatorClassName='rounded-full border-r-[3px] border-[var(--frame)]'
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            />
            <ProgressOverlayLabel
              overlayClassName='text-[var(--color-brand-ink)]'
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            >
              {t('usedDays', { used: usedDays, total: ptoDays, pct: usedPct })}
            </ProgressOverlayLabel>
          </div>
        </Progress>
        <Progress value={remainingPct}>
          <div className='relative h-[22px]'>
            <ProgressTrack
              className='h-[22px] rounded-full bg-background shadow-[var(--shadow-brutal-3)] flex items-center'
              indicatorClassName='rounded-full border-r-[3px] border-[var(--frame)] bg-[var(--color-brand-teal)]'
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            />
            <ProgressOverlayLabel
              overlayClassName='text-[var(--color-brand-ink)]'
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            >
              {t('remainingDays', { remaining, pct: remainingPct })}
            </ProgressOverlayLabel>
          </div>
        </Progress>
      </div>
    </div>
  );
}

interface PlannerPanelProps extends AlternativesProps {
  currentSelection: NonNullable<HolidaysState['currentSelection']>;
}

export const PlannerPanel = ({ currentSelection, ...alternativesProps }: PlannerPanelProps) => (
  <div className='w-full rounded-[10px] border-[3px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-md)]'>
    <Alternatives {...alternativesProps} />
    <div className='mt-3 border-t-[2px] border-[var(--frame)]/15' />
    <Status currentSelection={currentSelection} />
  </div>
);
