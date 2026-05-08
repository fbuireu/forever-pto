'use client';

import { useFiltersStore } from '@application/stores/filters';
import type { HolidaysState } from '@application/stores/holidays';
import { useHolidaysStore } from '@application/stores/holidays';
import { Button } from '@ui/modules/core/animate/components/buttons/Button';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';
import { Progress, ProgressTrack } from '@ui/modules/core/primitives/Progress';
import { cn } from '@ui/utils/utils';
import { MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface PtoStatusProps {
  currentSelection: NonNullable<HolidaysState['currentSelection']>;
}

export const PtoStatus = ({ currentSelection }: PtoStatusProps) => {
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
    <div
      className='rounded-[10px] border-[3px] border-[var(--frame)] bg-card px-4 py-3 shadow-[var(--shadow-brutal-md)]'
      data-tutorial='pto-status'
    >
      <div className='flex items-center justify-between flex-wrap gap-4 h-full'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 rounded-[10px] border-[3px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-teal)_18%,white_82%)] dark:bg-[color-mix(in_srgb,var(--color-brand-teal)_25%,black_75%)] px-3 py-1 shadow-[var(--shadow-brutal-xs)]'>
            <div className='h-3 w-3 rounded-full bg-teal-500' />
            <span className='text-sm text-muted-foreground'>{t('autoAssigned')}:</span>
            <SlidingNumber
              number={activeSuggestedCount}
              className='font-display font-black text-teal-700 dark:text-teal-300'
            />
          </div>
          <div className='flex items-center gap-2 rounded-[10px] border-[3px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,white_82%)] dark:bg-[color-mix(in_srgb,var(--color-brand-purple)_25%,black_75%)] px-3 py-1 shadow-[var(--shadow-brutal-xs)]'>
            <div className='h-3 w-3 rounded-full bg-blue-500' />
            <span className='text-sm text-muted-foreground'>{t('manual')}:</span>
            <SlidingNumber
              number={manualSelectedCount}
              className='font-display font-black text-blue-700 dark:text-blue-300'
            />
          </div>
          <div className='h-8 w-[2px] bg-[var(--frame)]/15' />
          <div className='flex flex-col items-center rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel-alt)] px-3 py-1.5 shadow-[var(--shadow-brutal-xs)]'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-display font-black uppercase tracking-[0.08em]'>{t('remaining')}:</span>
              <SlidingNumber
                number={remaining}
                className={cn(
                  'text-xl font-display font-black',
                  remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}
              />
            </div>
            {remaining > 0 ? (
              <MousePointerClick className='h-3 w-3 text-muted-foreground' />
            ) : !hasManualChanges ? (
              <span className='text-[10px] text-green-700 dark:text-green-400 font-medium'>✓ {t('allAssigned')}</span>
            ) : null}
          </div>
        </div>
        <div className='flex items-center gap-3 h-full'>
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
      <div className='mt-3 pt-3 border-t-[2px] border-[var(--frame)]/15 space-y-2'>
        <Progress value={usedPct === 100 ? 101 : usedPct}>
          <div className='relative h-[22px]'>
            <ProgressTrack
              className='h-[22px] rounded-full bg-background shadow-[3px_3px_0_0_var(--frame)] flex items-center'
              indicatorClassName='rounded-full border-r-[3px] border-[var(--frame)]'
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            />
            <span className='pointer-events-none absolute inset-0 grid place-items-center font-mono text-[11px] font-bold uppercase text-foreground'>
              {t('usedDays', { used: usedDays, total: ptoDays, pct: usedPct })}
            </span>
          </div>
        </Progress>
        <Progress value={remainingPct}>
          <div className='relative h-[22px]'>
            <ProgressTrack
              className='h-[22px] rounded-full bg-background shadow-[3px_3px_0_0_var(--frame)] flex items-center'
              indicatorClassName='rounded-full border-r-[3px] border-[var(--frame)] bg-[var(--color-brand-teal)]'
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            />
            <span className='pointer-events-none absolute inset-0 grid place-items-center font-mono text-[11px] font-bold uppercase text-foreground'>
              {t('remainingDays', { remaining, pct: remainingPct })}
            </span>
          </div>
        </Progress>
      </div>
    </div>
  );
};
