'use client';

import { usePremiumStore } from '@application/stores/premium';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@const/components/ui/input-group';
import { Label } from '@const/components/ui/label';
import { Euro, InfoIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';
import { ConditionalWrapper } from '../../core/ConditionalWrapper';

const WORKING_DAYS_PER_YEAR = 252;
const HOURS_PER_DAY = 8;

export const PtoSalaryCalculator = () => {
  const locale = useLocale();
  const [annualSalary, setAnnualSalary] = useState<number | undefined>();
  const [unusedPTODays, setUnusedPTODays] = useState<number>(5);

  const { currencySymbol, currency } = usePremiumStore(
    useShallow((state) => ({
      currencySymbol: state.currencySymbol,
      currency: state.currency,
    }))
  );

  const currencyPosition = useMemo(() => {
    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(0);
      return formatted.startsWith(currencySymbol) ? 'before' : 'after';
    } catch {
      return 'before';
    }
  }, [locale, currency, currencySymbol]);

  const dailyRate = annualSalary ? annualSalary / WORKING_DAYS_PER_YEAR : 0;
  const unusedPTOValue = dailyRate * unusedPTODays;
  const normalHourlyRate = annualSalary ? annualSalary / WORKING_DAYS_PER_YEAR / HOURS_PER_DAY : 0;
  const actualWorkingDays = WORKING_DAYS_PER_YEAR + unusedPTODays;
  const effectiveHourlyRate = annualSalary ? annualSalary / actualWorkingDays / HOURS_PER_DAY : 0;
  const showResults = annualSalary ? annualSalary > 0 && unusedPTODays >= 0 : false;

  const CurrencyNumber = ({ value, decimalPlaces = 0 }: { value: number; decimalPlaces?: number }) => {
    return (
      <ConditionalWrapper
        doWrap={currencyPosition === 'after'}
        wrapper={(children) => (
          <>
            {children}
            {currencySymbol}
          </>
        )}
      >
        <ConditionalWrapper
          doWrap={currencyPosition === 'before'}
          wrapper={(children) => (
            <>
              {currencySymbol}
              {children}
            </>
          )}
        >
          <SlidingNumber number={value} decimalPlaces={decimalPlaces} />
        </ConditionalWrapper>
      </ConditionalWrapper>
    );
  };

  return (
    <div className='space-y-3 p-2'>
      <div className='flex items-center gap-2'>
        <Euro className='w-4 h-4' />
        <span className='text-sm font-medium'>PTO vs Salary Calculator</span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild className='ml-auto'>
              <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
            </TooltipTrigger>
            <TooltipContent className='w-60 text-pretty'>
              Calculate how much paid time off you're giving up by not using your PTO days. You still get your full
              salary, but you're working days you could have taken as paid vacation.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='annualSalary' className='text-xs'>
          Annual Salary
        </Label>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>{currencySymbol}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id='annualSalary'
            type='number'
            min='0'
            step='1000'
            value={annualSalary}
            onChange={(e) => setAnnualSalary(Number(e.target.value))}
            className='h-8 text-xs'
            placeholder='50000'
          />
        </InputGroup>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='unusedPTO' className='text-xs'>
          Unused PTO Days
        </Label>
        <InputGroup>
          <InputGroupInput
            id='unusedPTO'
            type='number'
            min='0'
            max='50'
            value={unusedPTODays}
            onChange={(e) => setUnusedPTODays(Number(e.target.value))}
            className='h-8 text-xs'
            placeholder='5'
          />
        </InputGroup>
      </div>

      {showResults && (
        <div className='space-y-3 p-2 bg-muted rounded-md'>
          <div className='space-y-2'>
            <div className='text-xs'>
              <span className='font-medium text-red-600'>Value of unused PTO:</span>
              <div className='text-lg font-bold text-red-600 flex items-center gap-1'>
                <CurrencyNumber value={unusedPTOValue} decimalPlaces={0} />
              </div>
              <p className='text-muted-foreground'>Worth of paid vacation not taken</p>
            </div>

            <div className='text-xs border-t pt-2'>
              <span className='font-medium'>Your daily rate:</span>
              <div className='text-sm font-bold text-primary flex items-center gap-1'>
                <CurrencyNumber value={dailyRate} decimalPlaces={0} />
                <span className='text-muted-foreground'>/day</span>
              </div>
            </div>

            <div className='text-xs'>
              <span className='font-medium'>Your hourly rate:</span>
              <div className='text-sm font-bold flex items-center gap-1'>
                <CurrencyNumber value={normalHourlyRate} decimalPlaces={2} />
                <span className='text-muted-foreground'>/hour</span>
              </div>
              <p className='text-muted-foreground'>Standard working hours</p>
            </div>

            {unusedPTODays > 0 && (
              <>
                <div className='text-xs'>
                  <span className='font-medium text-orange-600'>Effective hourly rate:</span>
                  <div className='text-sm font-bold text-orange-600 flex items-center gap-1'>
                    <CurrencyNumber value={effectiveHourlyRate} decimalPlaces={2} />
                    <span className='text-muted-foreground'>/hour</span>
                  </div>
                  <p className='text-muted-foreground'>When working {unusedPTODays} extra unpaid days</p>
                </div>

                <div className='bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs'>
                  <p className='text-amber-700 dark:text-amber-400 font-medium'>Opportunity Cost</p>
                  <p className='text-amber-600 dark:text-amber-300'>
                    You worked {unusedPTODays} days that you could have taken as paid vacation. That's{' '}
                    <span className='inline-flex font-semibold'>
                      <CurrencyNumber value={unusedPTOValue} decimalPlaces={0} />
                    </span>{' '}
                    worth of paid time off you gave up. Your salary stays the same, but you worked extra days for free.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
