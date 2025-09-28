'use client';

import { Input } from '@const/components/ui/input';
import { Label } from '@const/components/ui/label';
import { Euro, InfoIcon } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';

const WORKING_DAYS_PER_YEAR = 252;
const HOURS_PER_DAY = 8;

export const PtoSalaryCalculator = () => {
  const [annualSalary, setAnnualSalary] = useState<number | undefined>();
  const [unusedPTODays, setUnusedPTODays] = useState<number>(5);

  const dailyRate = annualSalary ? annualSalary / WORKING_DAYS_PER_YEAR : 0;
  const unusedPTOValue = dailyRate * unusedPTODays;
  const effectiveHourlyRate = annualSalary ? annualSalary / (WORKING_DAYS_PER_YEAR - unusedPTODays) / HOURS_PER_DAY : 0;
  const showResults = annualSalary ? annualSalary > 0 && unusedPTODays >= 0 : false;

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
              Calculate the monetary value of unused PTO days and see the real cost of not taking your earned vacation
              time.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='annualSalary' className='text-xs'>
          Annual Salary (€)
        </Label>
        <Input
          id='annualSalary'
          type='number'
          min='0'
          step='1000'
          value={annualSalary}
          onChange={(e) => setAnnualSalary(Number(e.target.value))}
          className='h-8 text-xs'
          placeholder='50000'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='unusedPTO' className='text-xs'>
          Unused PTO Days
        </Label>
        <Input
          id='unusedPTO'
          type='number'
          min='0'
          max='50'
          value={unusedPTODays}
          onChange={(e) => setUnusedPTODays(Number(e.target.value))}
          className='h-8 text-xs'
          placeholder='5'
        />
      </div>

      {showResults && (
        <div className='space-y-3 p-2 bg-muted rounded-md'>
          <div className='space-y-2'>
            <div className='text-xs'>
              <span className='font-medium text-red-600'>Unused PTO Value:</span>
              <div className='text-lg font-bold text-red-600 flex items-center gap-1'>
                €<SlidingNumber number={unusedPTOValue} decimalPlaces={0} />
              </div>
              <p className='text-muted-foreground'>Money left on the table</p>
            </div>

            <div className='text-xs border-t pt-2'>
              <span className='font-medium'>Your daily rate:</span>
              <div className='text-sm font-bold text-primary flex items-center gap-1'>
                €<SlidingNumber number={dailyRate} decimalPlaces={0} />
                <span className='text-muted-foreground'>/day</span>
              </div>
            </div>

            <div className='text-xs'>
              <span className='font-medium'>Effective hourly rate:</span>
              <div className='text-sm font-bold flex items-center gap-1'>
                €<SlidingNumber number={effectiveHourlyRate} decimalPlaces={2} />
                <span className='text-muted-foreground'>/hour</span>
              </div>
              <p className='text-muted-foreground'>When working extra days</p>
            </div>

            {unusedPTODays > 0 && (
              <div className='bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs'>
                <p className='text-amber-700 dark:text-amber-400 font-medium'>Opportunity Cost Analysis</p>
                <p className='text-amber-600 dark:text-amber-300 flex gap-x-0.5 flex-row flex-wrap'>
                  By not taking {unusedPTODays} PTO days, you're effectively working for free and missing €
                  <SlidingNumber number={unusedPTOValue} decimalPlaces={0} /> worth of paid time off.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
