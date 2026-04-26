import type { HolidayDTO } from '@application/dto/holiday/types';
import { Button } from '@ui/modules/core/animate/components/buttons/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@ui/modules/core/primitives/Dialog';
import type { FromTo } from '@ui/modules/pages/planner/calendar/Calendar';
import { Calendar, CalendarSelectionMode } from '@ui/modules/pages/planner/calendar/Calendar';
import { formatDate } from '@ui/utils/dates';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('workdayCounterModal');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full h-8 text-xs justify-start'>
          <CalendarIcon className='w-3 h-3 mr-1' />
          {selectedRange
            ? `${formatDate({ date: selectedRange.from, locale, format: 'MMM d' })} - ${formatDate({ date: selectedRange.to, locale, format: 'MMM d' })}`
            : t('selectDateRange')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='text-sm'>{t('selectDateRange')}</DialogTitle>
        </DialogHeader>
        <div className='border-[3px] border-[var(--frame)] rounded-[10px] p-3 shadow-[var(--shadow-brutal-xs)]'>
          <Calendar
            mode={CalendarSelectionMode.RANGE}
            selected={selectedRange}
            onSelect={handleRangeSelect}
            showNavigation
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
