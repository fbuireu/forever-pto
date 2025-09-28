import type { HolidayDTO } from '@application/dto/holiday/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@const/components/ui/dialog';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import type { FromTo } from '../../core/Calendar';
import { Calendar } from '../../core/Calendar';
import { formatDate } from '../../utils/formatters';

export interface WorkdayCounterCalendarModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedRange: FromTo | undefined;
  handleRangeSelect: (date: Date | Date[] | FromTo | undefined) => void;
  locale: string;
  holidays: HolidayDTO[];
}

export const WorkdayCounterCalendarModal = ({
  open,
  setOpen,
  selectedRange,
  handleRangeSelect,
  locale,
  holidays,
}: WorkdayCounterCalendarModalProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
  );
};
