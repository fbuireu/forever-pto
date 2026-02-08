'use client';

import { useFiltersStore } from '@application/stores/filters';
import type { HolidaysState } from '@application/stores/holidays';
import { useHolidaysStore } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import { MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';

interface PtoStatusProps {
  currentSelection: NonNullable<HolidaysState['currentSelection']>;
}

export const PtoStatus = ({ currentSelection }: PtoStatusProps) => {
  const t = useTranslations('ptoStatus');
  const resetManualSelection = useHolidaysStore((state) => state.resetManualSelection);
  const ptoDays = useFiltersStore((state) => state.ptoDays);
  const { removedSuggestedDays, manuallySelectedDays } = useHolidaysStore(
    useShallow((state) => ({
      removedSuggestedDays: state.removedSuggestedDays,
      manuallySelectedDays: state.manuallySelectedDays,
    }))
  );

  const activeSuggestedCount = currentSelection.days.length - removedSuggestedDays.length;
  const manualSelectedCount = manuallySelectedDays.length;
  const remaining = ptoDays - activeSuggestedCount - manualSelectedCount;
  const hasManualChanges = manualSelectedCount > 0 || removedSuggestedDays.length > 0;

  return (
    <div className='p-2 rounded-2xl border shadow-sm bg-background' data-tutorial='pto-status'>
      <div className='flex items-center justify-between flex-wrap gap-4 h-full'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1'>
            <div className='h-3 w-3 rounded-full bg-teal-500' />
            <span className='text-sm text-muted-foreground'>{t('autoAssigned')}:</span>
            <SlidingNumber number={activeSuggestedCount} className='font-semibold text-teal-600 dark:text-teal-400' />
          </div>
          <div className='flex items-center gap-1'>
            <div className='h-3 w-3 rounded-full bg-blue-500' />
            <span className='text-sm text-muted-foreground'>{t('manual')}:</span>
            <SlidingNumber number={manualSelectedCount} className='font-semibold text-blue-600 dark:text-blue-400' />
          </div>
          <div className='h-6 w-px bg-border' />
          <div className='flex items-center gap-1'>
            <span className='text-sm font-medium'>{t('remaining')}:</span>
            <SlidingNumber
              number={remaining}
              className={cn(
                'text-xl font-bold',
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
              <span className='text-[10px] text-green-600 dark:text-green-400 font-medium ml-1'>
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
