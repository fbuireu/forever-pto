'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import { Label } from '@const/components/ui/label';
import { differenceInCalendarDays } from 'date-fns';
import { CalendarDays, InfoIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';
import type { FromTo } from '../../core/Calendar';
import { formatDate } from '../../utils/formatters';
import { calculateHolidaysInRange, calculateWeekends, calculateWorkdays } from '../../utils/helpers';

const CalendarModal = dynamic(() =>
  import('./WorkdayCounterCalendarModal').then((module) => ({ default: module.WorkdayCounterCalendarModal }))
);

export const WorkdayCounter = () => {
  const locale = useLocale();
  const [selectedRange, setSelectedRange] = useState<FromTo | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { holidays } = useHolidaysStore(
    useShallow((state) => ({
      holidays: state.holidays,
    }))
  );

  const handleRangeSelect = (date: Date | Date[] | FromTo | undefined) => {
    if (date && typeof date === 'object' && 'from' in date && 'to' in date) {
      setSelectedRange(date);
      if (date.from && date.to) {
        setIsCalendarOpen(false);
      }
    } else if (!date) {
      setSelectedRange(undefined);
    }
  };

  const clearSelection = () => {
    setSelectedRange(undefined);
  };

  const workdayCount = selectedRange ? calculateWorkdays(selectedRange, holidays) : 0;
  const totalDays = selectedRange ? differenceInCalendarDays(selectedRange.to, selectedRange.from) + 1 : 0;
  const weekendDays = selectedRange ? calculateWeekends(selectedRange) : 0;
  const holidayDays = selectedRange ? calculateHolidaysInRange(selectedRange, holidays) : 0;

  return (
    <div className='space-y-3 p-2'>
      <div className='flex items-center gap-2'>
        <CalendarDays className='w-4 h-4' />
        <span className='text-sm font-medium'>Workday Counter</span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild className='ml-auto'>
              <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
            </TooltipTrigger>
            <TooltipContent className='w-60 text-pretty'>
              Count working days between two dates, automatically excluding weekends and holidays. Useful for project
              planning and deadline calculations.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='space-y-2'>
        <Label className='text-xs'>Select Date Range</Label>
        <CalendarModal
          open={isCalendarOpen}
          setOpen={setIsCalendarOpen}
          selectedRange={selectedRange}
          handleRangeSelect={handleRangeSelect}
          locale={locale}
          holidays={holidays}
        />

        {selectedRange && (
          <Button variant='ghost' onClick={clearSelection} className='h-6 text-xs w-full'>
            Clear selection
          </Button>
        )}
      </div>

      {selectedRange && (
        <div className='space-y-3 p-3 bg-muted rounded-md'>
          <div className='text-xs'>
            <span className='font-medium'>Working Days</span>
            <div className='text-2xl font-bold text-primary'>
              <SlidingNumber number={workdayCount} decimalPlaces={0} />
            </div>
            <p className='text-muted-foreground'>Business days in selected range</p>
          </div>

          <div className='flex justify-between items-start text-xs border-t pt-3'>
            <div className='text-left'>
              <div className='font-medium'>Days</div>
              <div className='text-lg font-bold'>
                <SlidingNumber number={totalDays} decimalPlaces={0} />
              </div>
            </div>
            <div className='text-left'>
              <div className='font-medium'>Weekends</div>
              <div className='text-lg font-bold text-muted-foreground'>
                <SlidingNumber number={weekendDays} decimalPlaces={0} />
              </div>
            </div>
            <div className='text-left'>
              <div className='font-medium'>Holidays</div>
              <div className='text-lg font-bold text-muted-foreground'>
                <SlidingNumber number={holidayDays} decimalPlaces={0} />
              </div>
            </div>
          </div>

          <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs'>
            <p className='text-blue-700 dark:text-blue-400 font-medium'>Date Range</p>
            <p className='text-blue-600 dark:text-blue-300'>
              From {formatDate({ date: selectedRange.from, locale, format: 'EEEE, MMMM d, yyyy' })} to{' '}
              {formatDate({ date: selectedRange.to, locale, format: 'EEEE, MMMM d, yyyy' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
