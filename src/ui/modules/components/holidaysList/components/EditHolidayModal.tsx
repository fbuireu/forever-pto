'use client';

import type { HolidayDTO } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@const/components/ui/dialog';
import { Input } from '@const/components/ui/input';
import { Label } from '@const/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Calendar as CalendarIcon, Edit } from 'lucide-react';
import type { Locale } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { z } from 'zod';
import { Calendar, type FromTo } from '../../core/Calendar';
import { formatDate } from '../../utils/formatters';

interface EditHolidayModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  holiday: HolidayDTO;
}

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required').max(100, 'Holiday name is too long'),
  date: z.date({ error: 'Please select a date' }),
});

type HolidayFormData = z.infer<typeof holidaySchema>;

export const EditHolidayModal = ({ open, onClose, locale, holiday }: EditHolidayModalProps) => {
  const { holidays, editHoliday, currentSelection, alternatives, suggestion } = useHolidaysStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(holiday.date);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
  } = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    mode: 'onSubmit',
    defaultValues: {
      name: holiday.name,
    },
  });

  const handleClose = () => {
    reset();
    setSelectedDate(undefined);
    onClose();
  };

  const onSubmit = async (data: HolidayFormData) => {
    if (!holiday) return;

    if (data.date.getTime() === holiday.date.getTime()) {
      setValue('date', undefined as any, {
        shouldValidate: true,
      });
      setError('date', { message: 'Please select a different date' });
      return;
    }

    editHoliday({
      holidayId: holiday.id,
      updates: { name: data.name, date: data.date },
      locale,
    });
    handleClose();
  };

  const handleDateSelect = (date: Date | Date[] | FromTo | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date);
      setValue('date', date, { shouldValidate: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Edit className='w-5 h-5 text-blue-500' />
            Edit Holiday
          </DialogTitle>
          <DialogDescription>
            <span className='block my-2'>
              <CalendarDays className='w-4 h-4 inline mr-1' />
              Update the holiday by modifying the date or name
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
          <div className='space-y-2'>
            <Label htmlFor='name'>Holiday Name</Label>
            <Input id='name' type='text' placeholder='e.g. My birthday' autoFocus {...register('name')} />
            {errors.name && <p className='text-sm text-destructive mt-1'>{errors.name.message}</p>}
          </div>
          <div className='space-y-2'>
            <Label>Select Date</Label>
            <div className='border rounded-lg p-3'>
              <Calendar
                key={String(selectedDate)}
                mode='single'
                month={holiday?.date}
                showNavigation
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={locale}
                holidays={holidays}
                allowPastDays
                currentSelection={currentSelection}
                alternatives={alternatives}
                suggestion={suggestion}
                className='w-full'
              />
              {selectedDate && (
                <div className='mt-3 p-2 bg-muted rounded text-sm'>
                  <CalendarIcon className='w-4 h-4 inline mr-2' />
                  Selected: {formatDate({ date: selectedDate, locale, format: 'EEEE, MMMM d, yyyy' })}
                </div>
              )}
            </div>
            {errors.date && <p className='text-sm text-destructive mt-1'>{errors.date.message}</p>}
          </div>
          <div className='flex gap-2 pt-2'>
            <Button type='submit' className='flex-1'>
              <Edit className='w-4 h-4 mr-2' />
              Edit Holiday
            </Button>
            <Button type='button' variant='outline' onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
