'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import { Calendar, Clock, MousePointerClick } from 'lucide-react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { usePtoCalculations } from '@ui/hooks/usePtoCalculations';

export const PtoStatusBanner = () => {
  const resetManualSelection = useHolidaysStore((state) => state.resetManualSelection);
  const { totalPto, activeSuggestedCount, manualSelectedCount, remaining, hasManualChanges } = usePtoCalculations();

  return (
    <div className='mb-6 p-4 rounded-lg border bg-card shadow-sm'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-6'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Total PTO:</span>
            <span className='text-lg font-bold'>{totalPto}</span>
          </div>

          <div className='h-6 w-px bg-border' />

          <div className='flex items-center gap-2'>
            <div className='h-3 w-3 rounded-full bg-teal-500' />
            <span className='text-sm text-muted-foreground'>Auto-assigned:</span>
            <span className='font-semibold text-teal-600 dark:text-teal-400'>{activeSuggestedCount}</span>
          </div>

          <div className='flex items-center gap-2'>
            <div className='h-3 w-3 rounded-full bg-blue-500' />
            <span className='text-sm text-muted-foreground'>Manual:</span>
            <span className='font-semibold text-blue-600 dark:text-blue-400'>{manualSelectedCount}</span>
          </div>

          <div className='h-6 w-px bg-border' />

          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Remaining:</span>
            <span
              className={cn(
                'text-xl font-bold',
                remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {remaining}
            </span>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {hasManualChanges && (
            <Button variant='outline' size='sm' onClick={resetManualSelection} type='button' className='text-xs'>
              Reset Manual Changes
            </Button>
          )}
          {remaining > 0 && (
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <MousePointerClick className='h-3 w-3' />
              <span>Click days to assign/remove</span>
            </div>
          )}
          {remaining === 0 && !hasManualChanges && (
            <div className='text-xs text-green-600 dark:text-green-400 font-medium'>✓ All days assigned!</div>
          )}
        </div>
      </div>
    </div>
  );
};
