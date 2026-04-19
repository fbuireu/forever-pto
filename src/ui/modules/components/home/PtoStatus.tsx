'use client';

import { useFiltersStore } from '@application/stores/filters';
import type { HolidaysState } from '@application/stores/holidays';
import { useHolidaysStore } from '@application/stores/holidays';
import { Button } from '@ui/components/animate/components/buttons/button';
import { SlidingNumber } from '@ui/components/animate/text/sliding-number';
import { cn } from '@ui/lib/utils';
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

  const rawRemaining = Math.max(0, ptoDays - activeSuggestedCount - manualSelectedCount);
  const lastSettledRemaining = useRef(rawRemaining);
  useEffect(() => {
    if (!isCalculating) lastSettledRemaining.current = rawRemaining;
  });
  const remaining = isCalculating ? lastSettledRemaining.current : rawRemaining;

  const hasManualChanges = manualSelectedCount > 0 || removedSuggestedDays.length > 0;

  return (
    <div
      className='rounded-[1.35rem] border-[2.5px] border-[var(--frame)] bg-card px-4 py-3 shadow-[var(--shadow-brutal-md)]'
      data-tutorial='pto-status'
    >
      <div className='flex items-center justify-between flex-wrap gap-4 h-full'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 rounded-full border-[2px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-teal)_18%,white_82%)] px-3 py-1 shadow-[var(--shadow-brutal-xs)]'>
            <div className='h-3 w-3 rounded-full bg-teal-500' />
            <span className='text-sm text-muted-foreground'>{t('autoAssigned')}:</span>
            <SlidingNumber number={activeSuggestedCount} className='font-black text-teal-700 dark:text-teal-300' />
          </div>
          <div className='flex items-center gap-2 rounded-full border-[2px] border-[var(--frame)] bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,white_82%)] px-3 py-1 shadow-[var(--shadow-brutal-xs)]'>
            <div className='h-3 w-3 rounded-full bg-blue-500' />
            <span className='text-sm text-muted-foreground'>{t('manual')}:</span>
            <SlidingNumber number={manualSelectedCount} className='font-black text-blue-700 dark:text-blue-300' />
          </div>
          <div className='h-8 w-[2px] bg-[var(--frame)]/15' />
          <div className='flex items-center gap-2 rounded-full border-[2px] border-[var(--frame)] bg-[var(--surface-panel-alt)] px-3 py-1.5 shadow-[var(--shadow-brutal-xs)]'>
            <span className='text-sm font-black uppercase tracking-[0.08em]'>{t('remaining')}:</span>
            <SlidingNumber
              number={remaining}
              className={cn(
                'text-xl font-black',
                remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            />
            {remaining > 0 && (
              <span className='flex items-center text-muted-foreground ml-1'>
                <MousePointerClick className='h-3 w-3' />
                <span className='text-[10px]'>{t('clickDays')}</span>
              </span>
            )}
            {remaining === 0 && !hasManualChanges && (
              <span className='text-[10px] text-green-700 dark:text-green-400 font-medium ml-1'>
                ✓ {t('allAssigned')}
              </span>
            )}
          </div>
        </div>
        <div className='flex items-center gap-3 h-full'>
          {hasManualChanges && (
            <Button variant='outline' size='sm' onClick={resetManualSelection} type='button' className='text-xs'>
              {t('resetManual')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
