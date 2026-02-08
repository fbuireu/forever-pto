'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import { Field, Label } from '@headlessui/react';
import { useDebounce } from '@ui/hooks/useDebounce';
import { CalendarDays, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Counter } from 'src/components/animate-ui/components/counter';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';

const MIN_VALUE = 1;
const MAX_VALUE = 365;

export const PtoDays = () => {
  const t = useTranslations('ptoDays');
  const { ptoDays, setPtoDays } = useFiltersStore(
    useShallow((state) => ({
      ptoDays: state.ptoDays,
      setPtoDays: state.setPtoDays,
    }))
  );
  const { currentSelection, removedSuggestedDays, manuallySelectedDays, resetManualSelection } = useHolidaysStore(
    useShallow((state) => ({
      currentSelection: state.currentSelection,
      removedSuggestedDays: state.removedSuggestedDays,
      manuallySelectedDays: state.manuallySelectedDays,
      resetManualSelection: state.resetManualSelection,
    }))
  );
  const [localValue, setLocalValue] = useDebounce({ value: ptoDays, delay: 100, callback: setPtoDays });
  const isDecrementDisabled = localValue <= MIN_VALUE;
  const isIncrementDisabled = localValue >= MAX_VALUE;
  const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
  const manualSelectedCount = manuallySelectedDays.length;
  const remaining = ptoDays - activeSuggestedCount - manualSelectedCount;
  const hasManualChanges = manualSelectedCount > 0 || removedSuggestedDays.length > 0;

  const handleChange = (value: number) => {
    setLocalValue(Math.max(MIN_VALUE, value));
  };

  return (
    <Field className='space-y-2 w-full' data-tutorial='pto-days'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='pto-days'>
        <CalendarDays size={16} /> {t('title')}
      </Label>
      <div className='flex items-center font-normal gap-2 justify-between'>
        <p className='font-normal text-sm'>{t('iHave')}</p>
        <Counter
          id='pto-days'
          number={localValue}
          setNumber={handleChange}
          decrementButtonProps={{
            disabled: localValue <= MIN_VALUE,
            className: cn(isDecrementDisabled && 'cursor-not-allowed opacity-50'),
          }}
          incrementButtonProps={{
            disabled: localValue >= MAX_VALUE,
            className: cn(isIncrementDisabled && 'cursor-not-allowed opacity-50'),
          }}
          slidingNumberProps={{ className: 'font-normal text-sm' }}
        />
        <p className='font-normal text-sm'>{t('days')}</p>
      </div>
      <div className='space-y-2 mt-4 w-full'>
        <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='remaining-days'>
          <Clock size={16} /> {t('status')}
        </Label>
        <div className='space-y-2 w-full'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>{t('autoAssigned')}</span>
            <span aria-label={`${t('autoAssigned')}: ${activeSuggestedCount}`}>
              <SlidingNumber number={activeSuggestedCount} className='font-semibold text-teal-600 dark:text-teal-400' aria-hidden='true' />
            </span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>{t('manuallySelected')}</span>
            <span aria-label={`${t('manuallySelected')}: ${manualSelectedCount}`}>
              <SlidingNumber number={manualSelectedCount} className='font-semibold text-blue-600 dark:text-blue-400' aria-hidden='true' />
            </span>
          </div>
          <div className='h-px bg-border my-2' />
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium'>{t('remaining')}</span>
            <span aria-label={`${t('remaining')}: ${remaining}`}>
              <SlidingNumber
                number={remaining}
                className={cn(
                  'font-bold text-lg',
                  remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}
                aria-hidden='true'
              />
            </span>
          </div>
          {hasManualChanges && (
            <Button
              variant='outline'
              size='sm'
              onClick={resetManualSelection}
              className='w-full mt-2 text-xs'
              type='button'
            >
              {t('resetManualChanges')}
            </Button>
          )}
          {remaining === 0 && !hasManualChanges && (
            <p className='text-xs text-muted-foreground text-center mt-2'>{t('allAssigned')}</p>
          )}
          {remaining > 0 && (
            <p className='text-xs text-muted-foreground text-center mt-2'>{t('clickToAssign')}</p>
          )}
        </div>
      </div>
    </Field>
  );
};
