'use client';

import { useFiltersStore } from '@application/stores/filters';
import { Combobox } from '@const/components/ui/combobox';
import { Input } from '@const/components/ui/input';
import { Label } from '@const/components/ui/label';
import { Calculator, InfoIcon, Plus } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip } from 'src/components/animate-ui/radix/tooltip';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';
import { getMonthNames } from '../../utils/helpers';

interface MonthOption {
  value: string;
  label: string;
}

export const PtoCalculator = () => {
  const locale = useLocale();
  const [daysPerMonth, setDaysPerMonth] = useState<number>(2.5);
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);

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

  const calculateAccumulatedDays = () => {
    const accumulated = daysPerMonth * Number(selectedMonth);
    setCalculatedDays(Number(accumulated.toFixed(2)));
  };

  const applyToStore = (days: number) => {
    setPtoDays(days);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  return (
    <div className='space-y-3 p-2'>
      <div className='flex items-center gap-2'>
        <Calculator className='w-4 h-4' />
        <span className='text-sm font-medium'>PTO Accumulator</span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild className='ml-auto'>
              <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
            </TooltipTrigger>
            <TooltipContent className='w-60 text-pretty'>
              Calculate your accumulated PTO days based on monthly accrual. Most companies offer 2-3 days per month.
              Select the target month to see your total available days.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='daysPerMonth' className='text-xs'>
          Days per month
        </Label>
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

      <div className='space-y-2'>
        <Label className='text-xs'>Calculate through</Label>
        <Combobox
          value={selectedMonth}
          options={monthOptions}
          onChange={handleMonthChange}
          placeholder='Select month'
          searchPlaceholder='Search month...'
          notFoundText='Month not found'
          className='w-full h-8 text-xs'
        />
      </div>

      <Button onClick={calculateAccumulatedDays} size='sm' className='w-full h-8 text-xs' variant='outline'>
        <Calculator className='w-3 h-3 mr-1' />
        Calculate
      </Button>

      {calculatedDays !== null && (
        <div className='space-y-2 p-2 bg-muted rounded-md'>
          <div className='text-xs'>
            <span className='font-medium'>Result:</span>
            <div className='text-lg font-bold text-primary flex items-center gap-1'>
              <SlidingNumber number={calculatedDays} decimalPlaces={2} />
              <span>days</span>
            </div>
            <p className='text-muted-foreground flex gap-0.5'>
              <SlidingNumber number={daysPerMonth} decimalPlaces={1} /> days/month ×{' '}
              <SlidingNumber number={selectedMonth} /> months
            </p>
          </div>

          <Button
            onClick={() => applyToStore(calculatedDays)}
            size='sm'
            className='w-full h-7 text-xs bg-green-600 hover:bg-green-700'
          >
            <Plus className='w-3 h-3 mr-1' />
            Apply to PTO Days
          </Button>
        </div>
      )}
    </div>
  );
};
