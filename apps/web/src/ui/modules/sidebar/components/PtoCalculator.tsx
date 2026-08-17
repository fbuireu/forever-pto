'use client';

import { MIN_PTO_DAYS, useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Plus } from '@ui/modules/core/animate/icons/Plus';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';
import { Button } from '@ui/modules/core/primitives/Button';
import { Combobox } from '@ui/modules/core/primitives/Combobox';
import { Input } from '@ui/modules/core/primitives/Input';
import { getMonthNames } from '@ui/modules/pages/planner/utils/helpers';
import { SidebarFieldTooltip } from '@ui/modules/sidebar/components/SidebarFieldLabel';
import { Calculator } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface MonthOption {
  value: string;
  label: string;
}

interface PtoCalculatorProps {
  currentYear: number;
}

export const PtoCalculator = ({ currentYear }: PtoCalculatorProps) => {
  const locale = useLocale();
  const t = useTranslations('ptoCalculator');
  const [daysPerMonth, setDaysPerMonth] = useState<number>(2.5);
  const [selectedMonth, setSelectedMonth] = useState<string>('1');
  const [result, setResult] = useState<{ total: number; days: number; month: number } | null>(null);

  const { ptoDays, setPtoDays } = useFiltersStore(
    useShallow((state) => ({
      ptoDays: state.ptoDays,
      setPtoDays: state.setPtoDays,
    }))
  );
  const trimManualDays = useHolidaysStore((state) => state.trimManualDays);

  const monthOptions: MonthOption[] = useMemo(() => {
    const monthNames = getMonthNames({
      locale,
      monthCount: 12,
      startYear: currentYear,
      monthOutputFormat: 'long',
    });

    return monthNames.map((monthName, index) => ({
      value: (index + 1).toString(),
      label: monthName,
    }));
  }, [locale, currentYear]);

  const handleCalculate = () => {
    const monthNumber = Number(selectedMonth);
    const accumulated = daysPerMonth * monthNumber;

    setResult({
      total: Number(accumulated.toFixed(2)),
      days: daysPerMonth,
      month: monthNumber,
    });
  };

  const applyToStore = (days: number) => {
    const nextBudget = Math.max(MIN_PTO_DAYS, Math.round(days));
    if (nextBudget === ptoDays) return;

    setPtoDays(nextBudget);
    trimManualDays(nextBudget);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  return (
    <div className='space-y-2 w-full'>
      <div className='flex gap-2 my-2 text-sm font-normal'>
        <Calculator size={16} /> {t('title')}
        <SidebarFieldTooltip label={t('tooltipLabel')} className='w-60'>
          {t('tooltip')}
        </SidebarFieldTooltip>
      </div>

      <div className='space-y-2 w-full'>
        <p className='text-xs text-muted-foreground'>{t('daysPerMonth')}</p>
        <Input
          id='daysPerMonth'
          type='number'
          inputMode='decimal'
          step='0.1'
          min='0'
          max='8'
          value={daysPerMonth}
          onChange={(e) => setDaysPerMonth(Number(e.target.value))}
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
          className='w-full'
        />
      </div>

      <Button onClick={handleCalculate} className='w-full' variant='outline'>
        <Calculator className='size-3 mr-1' />
        {t('calculate')}
      </Button>

      {result !== null && (
        <div className='space-y-2 p-2 bg-muted rounded-md w-full'>
          <div className='text-xs'>
            <span className='font-display font-medium'>{t('result')}</span>
            <div className='text-lg font-display font-bold text-primary flex items-center gap-1'>
              <SlidingNumber number={result.total} decimalPlaces={2} />
              <span>{t('days')}</span>
            </div>
            <p className='text-muted-foreground flex gap-0.5'>
              <SlidingNumber number={result.days} decimalPlaces={1} /> {t('daysMonth')} ×{' '}
              <SlidingNumber number={result.month} decimalPlaces={0} /> {t('months')}
            </p>
          </div>
          <AnimateIcon animateOnHover>
            <Button
              onClick={() => applyToStore(result.total)}
              size='sm'
              variant='success'
              className='w-full justify-start'
            >
              <Plus className='size-3 mr-1' />
              {t('applyToPtoDays')}
            </Button>
          </AnimateIcon>
        </div>
      )}
    </div>
  );
};
