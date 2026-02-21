'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@const/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Calendar as CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Plus } from 'src/components/animate-ui/icons/plus';
import { Calendar, CalendarSelectionMode, type FromTo } from '../../core/Calendar';
import { formatDate } from '../../utils/formatters';
import { type HolidayFormData, createHolidaySchema } from './schema';
import { useFiltersStore } from '@application/stores/filters';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';

interface AddHolidayModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
}

export const AddHolidayModal = ({ open, onClose, locale }: AddHolidayModalProps) => {
  const t = useTranslations('modals.addHoliday');
  const tValidation = useTranslations('validation.holiday');
  const { holidays, addHoliday, currentSelection, alternatives, suggestion } = useHolidaysStore();
  const { carryOverMonths, year } = useFiltersStore();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isPending, startTransition] = useTransition();

  const holidaySchema = createHolidaySchema({
    nameRequired: tValidation('nameRequired'),
    nameMax: tValidation('nameMax'),
    invalidDate: tValidation('invalidDate'),
  });

  const form = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedDate(undefined);
    onClose();
  };

  const onSubmit = (data: HolidayFormData) => {
    startTransition(() => {
      try {
        const existingHoliday = holidays.find((holiday) => holiday.date.toDateString() === data.date.toDateString());
        const formattedDate = formatDate({ date: data.date, locale, format: 'MMMM d, yyyy' });

        if (existingHoliday) {
          toast.error(t('existsTitle'), {
            description: t('existsDescription', { date: formattedDate, name: existingHoliday.name }),
          });
          return;
        }

        addHoliday({ holiday: { name: data.name, date: data.date }, locale, carryOverMonths, year });

        toast.success(t('successTitle'), {
          description: t('successDescription', { name: data.name, date: formattedDate }),
        });

        handleClose();
      } catch (error) {
        getBetterStackInstance().logError('Error creating holiday', error, { component: 'AddHolidayModal' });
        toast.error(t('errorTitle'), {
          description: t('errorDescription'),
        });
      }
    });
  };

  const handleDateSelect = (date: Date | Date[] | FromTo | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date);
      form.setValue('date', date, { shouldValidate: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-sm' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Plus className='w-5 h-5 text-green-500' animateOnView loop />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            <span className='block my-2'>
              <CalendarDays className='w-4 h-4 inline mr-1' />
              {t('description')}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6' noValidate>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nameLabel')}</FormLabel>
                  <FormControl>
                    <Input type='text' inputMode='text' placeholder={t('namePlaceholder')} autoFocus disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='date'
              render={() => (
                <FormItem>
                  <FormLabel>{t('dateLabel')}</FormLabel>
                  <FormControl>
                    <div className='border rounded-lg p-3'>
                      <Calendar
                        mode={CalendarSelectionMode.SINGLE}
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
                        disabled={isPending}
                      />
                      {selectedDate && (
                        <div className='mt-3 p-2 bg-muted rounded text-sm flex align-items-center'>
                          <CalendarIcon className='w-4 h-4 inline mr-2' />
                          {t('selected')}:{' '}
                          {formatDate({
                            date: selectedDate,
                            locale,
                            format: 'EEEE, MMMM d, yyyy',
                          })}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <div className='flex gap-2 pt-2'>
                <Button type='submit' className='flex-1' disabled={isPending}>
                  <Plus className='w-4 h-4 mr-2' />
                  {isPending ? t('submitting') : t('submit')}
                </Button>
                <Button type='button' variant='outline' onClick={handleClose} disabled={isPending}>
                  {t('cancel')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
