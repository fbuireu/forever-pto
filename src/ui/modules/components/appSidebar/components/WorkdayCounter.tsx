'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@const/components/ui/dialog';
import { Label } from '@const/components/ui/label';
import { differenceInCalendarDays, eachDayOfInterval, isWeekend } from 'date-fns';
import { CalendarDays, Calendar as CalendarIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';
import { Calendar, FromTo } from '../../core/Calendar';
import { formatDate } from '../../utils/formatters';
import { Button } from 'src/components/animate-ui/components/buttons/button';

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
      </div>

      <p className='text-xs text-muted-foreground leading-relaxed'>
        Count working days between two dates, automatically excluding weekends and holidays. Useful for project planning
        and deadline calculations.
      </p>

      <div className='space-y-2'>
        <Label className='text-xs'>Select Date Range</Label>
        <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <DialogTrigger asChild>
            <Button variant='outline' className='w-full h-8 text-xs justify-start'>
              <CalendarIcon className='w-3 h-3 mr-1' />
              {selectedRange
                ? `${formatDate({ date: selectedRange.from, locale, format: 'MMM d' })} - ${formatDate({ date: selectedRange.to, locale, format: 'MMM d' })}`
                : 'Select date range'}
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle className='text-sm'>Select date range</DialogTitle>
            </DialogHeader>
            <div className='border rounded-lg p-3'>
              <Calendar
                mode='range'
                selected={selectedRange}
                onSelect={handleRangeSelect}
                showNavigation={true}
                locale={locale}
                holidays={holidays}
                allowPastDays
                currentSelection={{ days: [] }}
                alternatives={[]}
                suggestion={{ days: [] }}
                className='w-full'
              />
            </div>
          </DialogContent>
        </Dialog>

        {selectedRange && (
          <Button variant='ghost' onClick={clearSelection} className='h-6 text-xs w-full'>
            Clear selection
          </Button>
        )}
      </div>

      {selectedRange && (
        <div className='space-y-3 p-3 bg-muted rounded-md'>
          <div className='text-xs'>
            <span className='font-medium'>Working Days:</span>
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

function calculateWorkdays(range: FromTo, holidays: any[]): number {
  const days = eachDayOfInterval({
    start: range.from,
    end: range.to,
  });

  return days.filter((day) => {
    if (isWeekend(day)) return false;

    const isHoliday = holidays.some((holiday) => holiday.date.toDateString() === day.toDateString());
    if (isHoliday) return false;

    return true;
  }).length;
}

function calculateWeekends(range: FromTo): number {
  const days = eachDayOfInterval({
    start: range.from,
    end: range.to,
  });
  return days.filter((day) => isWeekend(day)).length;
}

function calculateHolidaysInRange(range: FromTo, holidays: any[]): number {
  const days = eachDayOfInterval({
    start: range.from,
    end: range.to,
  });

  return days.filter((day) => {
    return holidays.some((holiday) => holiday.date.toDateString() === day.toDateString());
  }).length;
}
