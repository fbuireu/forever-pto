'use client';

import { logClientError } from '@application/shared/utils/clientLog';
import { formatDate } from '@application/shared/utils/dates';
import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/modules/core/animate/base/Dialog';
import { Plus } from '@ui/modules/core/animate/icons/Plus';
import { Button } from '@ui/modules/core/primitives/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@ui/modules/core/primitives/Form';
import { Input } from '@ui/modules/core/primitives/Input';
import { Calendar, CalendarSelectionMode, type FromTo } from '@ui/modules/pages/planner/calendar/Calendar';
import { describeHolidayRefusal } from '@ui/modules/pages/planner/calendar/utils/refusals';
import { CalendarDays, Calendar as CalendarIcon } from 'lucide-react';
import type { Locale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { createHolidaySchema, type HolidayFormData } from './schema';

interface AddHolidayModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
}

export const AddHolidayModal = ({ open, onClose, locale }: AddHolidayModalProps) => {
  const t = useTranslations('modals.addHoliday');
  const tA11y = useTranslations('a11y');
  const tValidation = useTranslations('validation.holiday');
  const { holidays, addHoliday, currentSelection, alternatives, suggestion } = useHolidaysStore(
    useShallow((state) => ({
      holidays: state.holidays,
      addHoliday: state.addHoliday,
      currentSelection: state.currentSelection,
      alternatives: state.alternatives,
      suggestion: state.suggestion,
    }))
  );
  const { carryOverMonths, year } = useFiltersStore(
    useShallow((state) => ({ carryOverMonths: state.carryOverMonths, year: state.year }))
  );
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
        const formattedDate = formatDate({ date: data.date, locale, format: 'MMMM d, yyyy' });
        const outcome = addHoliday({ holiday: { name: data.name, date: data.date }, carryOverMonths, year });

        if (!outcome.applied) {
          const refusal = describeHolidayRefusal({ outcome, t, formattedDate });

          if (refusal) toast.error(refusal.title, { description: refusal.description });
          else toast.error(t('errorTitle'), { description: t('errorDescription') });

          return;
        }

        toast.success(t('successTitle'), {
          description: t('successDescription', { name: data.name, date: formattedDate }),
        });

        handleClose();
      } catch (error) {
        logClientError('Error creating holiday', error, { component: 'AddHolidayModal' });
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
      <DialogContent className='sm:max-w-sm' closeLabel={tA11y('closeDialog')} initialFocus={false}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Plus className='size-5 text-primary' animateOnHover />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            <span className='block my-2'>
              <CalendarDays className='size-4 inline mr-1' />
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
                    <Input
                      type='text'
                      inputMode='text'
                      placeholder={t('namePlaceholder')}
                      autoComplete='off'
                      disabled={isPending}
                      {...field}
                    />
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
                    <div className='border-[3px] border-[var(--frame)] rounded-[10px] p-3 shadow-[var(--shadow-brutal-xs)]'>
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
                          <CalendarIcon className='size-4 inline mr-2' />
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
                <Button type='submit' variant='success' className='flex-1' disabled={isPending}>
                  <Plus className='size-4 mr-2' />
                  {isPending ? t('submitting') : t('submit')}
                </Button>
                <Button type='button' variant='destructive' onClick={handleClose} disabled={isPending}>
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
