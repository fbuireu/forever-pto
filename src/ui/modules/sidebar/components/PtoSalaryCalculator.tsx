'use client';

import { useUIStore } from '@application/stores/ui';
import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipProvider } from '@ui/modules/core/animate/base/Tooltip';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@ui/modules/core/primitives/InputGroup';
import { ConditionalWrapper } from '@ui/modules/shared/ConditionalWrapper';
import { Euro } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

const WORKING_DAYS_PER_YEAR = 252;
const HOURS_PER_DAY = 8;

interface CurrencyNumberProps {
  value: number;
  decimalPlaces?: number;
  currencyPosition: 'before' | 'after';
  currencySymbol: string;
}

const CurrencyNumber = ({ value, decimalPlaces = 0, currencyPosition, currencySymbol }: CurrencyNumberProps) => (
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

export const PtoSalaryCalculator = () => {
  const locale = useLocale();
  const t = useTranslations('ptoSalaryCalculator');
  const [annualSalary, setAnnualSalary] = useState<number | undefined>();
  const [unusedPTODays, setUnusedPTODays] = useState<number>(5);

  const { currencySymbol, currency } = useUIStore(
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
      return formatted.startsWith(currencySymbol) ? ('before' as const) : ('after' as const);
    } catch {
      return 'before' as const;
    }
  }, [locale, currency, currencySymbol]);

  const dailyRate = annualSalary ? annualSalary / WORKING_DAYS_PER_YEAR : 0;
  const unusedPTOValue = dailyRate * unusedPTODays;
  const normalHourlyRate = annualSalary ? annualSalary / WORKING_DAYS_PER_YEAR / HOURS_PER_DAY : 0;
  const actualWorkingDays = WORKING_DAYS_PER_YEAR + unusedPTODays;
  const effectiveHourlyRate = annualSalary ? annualSalary / actualWorkingDays / HOURS_PER_DAY : 0;
  const showResults = annualSalary ? annualSalary > 0 && unusedPTODays >= 0 : false;

  return (
    <div className='space-y-2 w-full'>
      <div className='flex gap-2 text-sm font-normal'>
        <Euro size={16} /> {t('title')}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipInfoTrigger aria-label={t('tooltipLabel')} />
            <TooltipContent className='w-60 text-pretty'>{t('tooltip')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='space-y-2 w-full'>
        <p className='text-xs text-muted-foreground'>{t('annualSalary')}</p>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>{currencySymbol}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id='annualSalary'
            type='number'
            inputMode='numeric'
            autoComplete='off'
            min='0'
            step='1000'
            value={annualSalary}
            onChange={(e) => setAnnualSalary(Number(e.target.value))}
            placeholder={t('annualSalaryPlaceholder', { amount: 50_000 })}
          />
        </InputGroup>
      </div>

      <div className='space-y-2 w-full'>
        <p className='text-xs text-muted-foreground'>{t('unusedPtoDays')}</p>
        <InputGroup>
          <InputGroupInput
            id='unusedPTO'
            type='number'
            min='0'
            max='50'
            inputMode='numeric'
            autoComplete='off'
            value={unusedPTODays}
            onChange={(e) => setUnusedPTODays(Number(e.target.value))}
            placeholder={t('unusedPtoDaysPlaceholder', { days: 5 })}
          />
        </InputGroup>
      </div>

      {showResults && (
        <div className='space-y-2 w-full bg-muted rounded-md p-3'>
          <div className='space-y-2 w-full'>
            <div className='text-xs'>
              <span className='font-display font-medium text-red-600'>{t('valueOfUnusedPto')}</span>
              <div className='text-lg font-display font-bold text-red-600 flex items-center gap-1'>
                <CurrencyNumber
                  value={unusedPTOValue}
                  decimalPlaces={0}
                  currencyPosition={currencyPosition}
                  currencySymbol={currencySymbol}
                />
              </div>
              <p className='text-muted-foreground'>{t('worthOfPaidVacation')}</p>
            </div>

            <div className='text-xs border-t pt-2'>
              <span className='font-display font-medium'>{t('yourDailyRate')}</span>
              <div className='text-sm font-display font-bold text-primary flex items-center gap-1'>
                <CurrencyNumber
                  value={dailyRate}
                  decimalPlaces={0}
                  currencyPosition={currencyPosition}
                  currencySymbol={currencySymbol}
                />
                <span className='text-muted-foreground'>{t('perDay')}</span>
              </div>
            </div>

            <div className='text-xs'>
              <span className='font-display font-medium'>{t('yourHourlyRate')}</span>
              <div className='text-sm font-display font-bold flex items-center gap-1'>
                <CurrencyNumber
                  value={normalHourlyRate}
                  decimalPlaces={2}
                  currencyPosition={currencyPosition}
                  currencySymbol={currencySymbol}
                />
                <span className='text-muted-foreground'>{t('perHour')}</span>
              </div>
              <p className='text-muted-foreground'>{t('standardWorkingHours')}</p>
            </div>

            {unusedPTODays > 0 && (
              <>
                <div className='text-xs'>
                  <span className='font-display font-medium text-orange-600'>{t('effectiveHourlyRate')}</span>
                  <div className='text-sm font-display font-bold text-orange-600 flex items-center gap-1'>
                    <CurrencyNumber
                      value={effectiveHourlyRate}
                      decimalPlaces={2}
                      currencyPosition={currencyPosition}
                      currencySymbol={currencySymbol}
                    />
                    <span className='text-muted-foreground'>{t('perHour')}</span>
                  </div>
                  <p className='text-muted-foreground'>{t('whenWorkingExtraDays', { days: unusedPTODays })}</p>
                </div>

                <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs'>
                  <p className='text-blue-700 dark:text-blue-400 font-display font-medium'>{t('opportunityCost')}</p>
                  <p className='text-blue-600 dark:text-blue-300'>
                    {t.rich('opportunityCostDescription', {
                      days: unusedPTODays,
                      amount: (_chunks) => (
                        <span className='inline-flex font-semibold'>
                          <CurrencyNumber
                            value={unusedPTOValue}
                            decimalPlaces={0}
                            currencyPosition={currencyPosition}
                            currencySymbol={currencySymbol}
                          />
                        </span>
                      ),
                    })}
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
