'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import { MousePointerClick } from 'lucide-react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { useShallow } from 'zustand/react/shallow';

export const PtoStatus = () => {
  const resetManualSelection = useHolidaysStore((state) => state.resetManualSelection);
  const ptoDays = useFiltersStore((state) => state.ptoDays);
  const { currentSelection, removedSuggestedDays, manuallySelectedDays } = useHolidaysStore(
    useShallow((state) => ({
      currentSelection: state.currentSelection,
      removedSuggestedDays: state.removedSuggestedDays,
      manuallySelectedDays: state.manuallySelectedDays,
    }))
  );
  const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
  const manualSelectedCount = manuallySelectedDays.length;
  const remaining = ptoDays - activeSuggestedCount - manualSelectedCount;
  const hasManualChanges = manualSelectedCount > 0 || removedSuggestedDays.length > 0;

  return (
    <div className='p-2 rounded-2xl border shadow-sm  bg-background'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1'>
            <div className='h-3 w-3 rounded-full bg-teal-500' />
            <span className='text-sm text-muted-foreground'>Auto-assigned:</span>
            <span className='font-semibold text-teal-600 dark:text-teal-400'>{activeSuggestedCount}</span>
          </div>
          <div className='flex items-center gap-1'>
            <div className='h-3 w-3 rounded-full bg-blue-500' />
            <span className='text-sm text-muted-foreground'>Manual:</span>
            <span className='font-semibold text-blue-600 dark:text-blue-400'>{manualSelectedCount}</span>
          </div>
          <div className='h-6 w-px bg-border' />
          <div className='flex items-center flex-col relative'>
            <div className='flex flex-row items-baseline gap-x-2'>
              <span className='text-sm font-medium'>
                Remaining:{' '}
                <p
                  className={cn(
                    'text-xl font-bold inline',
                    remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )}
                >
                  {remaining}
                </p>
              </span>
            </div>

            {remaining > 0 && (
              <div className='flex items-baseline text-xs text-muted-foreground'>
                <MousePointerClick className='h-3 w-3' />
                <span className='text-[10px]'>Click days to assign/remove</span>
              </div>
            )}
            {remaining === 0 && !hasManualChanges && (
              <div className='text-xs text-green-600 dark:text-green-400 font-medium text-[10px]'>
                ✓ All days assigned!
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {hasManualChanges && (
            <Button variant='outline' size='sm' onClick={resetManualSelection} type='button' className='text-xs'>
              Reset Manual Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
