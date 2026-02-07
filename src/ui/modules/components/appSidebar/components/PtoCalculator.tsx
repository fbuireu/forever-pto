'use client';

import { useFiltersStore } from '@application/stores/filters';
import { Combobox } from '@const/components/ui/combobox';
import { Input } from '@const/components/ui/input';
import { Field, Label } from '@headlessui/react';
import { Calculator, InfoIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';
import { getMonthNames } from '../../utils/helpers';
import { Plus } from 'src/components/animate-ui/icons/plus';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';

interface MonthOption {
  value: string;
  label: string;
}

export const PtoCalculator = () => {
  const locale = useLocale();
  const t = useTranslations('ptoCalculator');
  const [daysPerMonth, setDaysPerMonth] = useState<number>(2.5);
  const [selectedMonth, setSelectedMonth] = useState<string>('1');
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);
  const calculationSnapshotRef = useRef<{ days: number; month: number } | null>(null);

  const { setPtoDays } = useFiltersStore(
    useShallow((state) => ({
      ptoDays: state.ptoDays,
      setPtoDays: state.setPtoDays,
    }))
  );

  const monthOptions: MonthOption[] = useMemo(() => {
    const monthNames = getMonthNames({
      locale,
      monthCount: 12,
      startYear: new Date().getFullYear(),
      monthOutputFormat: 'long',
    });

    return monthNames.map((monthName, index) => ({
      value: (index + 1).toString(),
      label: monthName,
    }));
  }, [locale]);

  const handleCalculate = () => {
    const monthNumber = Number(selectedMonth);
    const accumulated = daysPerMonth * monthNumber;

    calculationSnapshotRef.current = {
      days: daysPerMonth,
      month: monthNumber,
    };

    setCalculatedDays(Number(accumulated.toFixed(2)));
  };

  const applyToStore = (days: number) => {
    setPtoDays(Math.round(days));
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal'>
        <Calculator size={16} /> {t('title')}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger aria-label={t('tooltipLabel')} className='ml-auto cursor-help'>
              <InfoIcon className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
            </TooltipTrigger>
            <TooltipContent className='w-60 text-pretty'>{t('tooltip')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>

      <div className='space-y-2 w-full'>
        <p className='text-xs text-muted-foreground'>{t('daysPerMonth')}</p>
        <Input
          id='daysPerMonth'
          type='number'
          step='0.1'
          min='0'
          max='8'
          value={daysPerMonth}
          onChange={(e) => setDaysPerMonth(Number(e.target.value))}
          className='h-8 text-xs'
        />
      </div>

      <div className='space-y-2 w-full'>
        <p className='text-xs text-muted-foreground'>{t('calculateThrough')}</p>
        <Combobox
          value={selectedMonth}
          options={monthOptions}
          onChange={handleMonthChange}
          placeholder={t('selectMonth')}
          searchPlaceholder={t('searchMonth')}
          notFoundText={t('monthNotFound')}
          className='w-full h-8 text-xs'
        />
      </div>

      <Button onClick={handleCalculate} size='sm' className='w-full h-8 text-xs' variant='outline'>
        <Calculator className='w-3 h-3 mr-1' />
        {t('calculate')}
      </Button>

      {calculatedDays !== null && calculationSnapshotRef.current && (
        <div className='space-y-2 p-2 bg-muted rounded-md w-full'>
          <div className='text-xs'>
            <span className='font-medium'>{t('result')}</span>
            <div className='text-lg font-bold text-primary flex items-center gap-1'>
              <SlidingNumber number={calculatedDays} decimalPlaces={2} />
              <span>{t('days')}</span>
            </div>
            <p className='text-muted-foreground flex gap-0.5'>
              <SlidingNumber number={calculationSnapshotRef.current.days} decimalPlaces={1} /> {t('daysMonth')} ×{' '}
              <SlidingNumber number={calculationSnapshotRef.current.month} decimalPlaces={0} /> {t('months')}
            </p>
          </div>
          <AnimateIcon animateOnHover>
            <Button
              onClick={() => applyToStore(calculatedDays)}
              size='sm'
              className='w-full h-7 text-xs bg-green-600 hover:bg-green-700 justify-start'
            >
              <Plus className='w-3 h-3 mr-1' />
              {t('applyToPtoDays')}
            </Button>
          </AnimateIcon>
        </div>
      )}
    </Field>
  );
};
