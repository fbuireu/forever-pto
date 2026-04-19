'use client';

import { useFiltersStore } from '@application/stores/filters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ui/components/animate/base/tooltip';
import { AnimateIcon } from '@ui/components/animate/icons/icon';
import { SlidersHorizontal } from '@ui/components/animate/icons/sliders-horizontal';
import { SlidingNumber } from '@ui/components/animate/text/sliding-number';
import { Slider } from '@ui/components/primitives/slider';
import { InfoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PremiumFeature } from '../../premium/PremiumFeature';

const MIN_VALUE = 1;
const MAX_VALUE = 12;
const DEBOUNCE_DELAY = 300;

export const CarryOverMonths = () => {
  const t = useTranslations('sidebar.carryOverMonths');
  const carryOverMonths = useFiltersStore((state) => state.carryOverMonths);
  const setCarryOverMonths = useFiltersStore((state) => state.setCarryOverMonths);
  const [localValue, setLocalValue] = useState(carryOverMonths);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    setLocalValue(carryOverMonths);
  }, [carryOverMonths]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (value: number[]) => {
      const newValue = value[0];

      setLocalValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCarryOverMonths(newValue);
      }, DEBOUNCE_DELAY);
    },
    [setCarryOverMonths]
  );

  return (
    <AnimateIcon animateOnHover>
      <div className='space-y-2 w-full pb-4' data-tutorial='carry-over'>
        <label className='flex gap-2 my-2 text-sm font-normal' htmlFor='carry-over-months'>
          <SlidersHorizontal size={16} /> {t('title')}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger aria-label={t('tooltipLabel')} className='ml-auto cursor-help'>
                <InfoIcon className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
              </TooltipTrigger>
              <TooltipContent className='w-50 text-pretty'>{t('tooltip')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <PremiumFeature feature={t('title')}>
          <div className='flex gap-4 items-center w-full'>
            <p className='font-normal text-sm'>{MIN_VALUE}</p>
            <div className='relative flex-1'>
              <Slider
                id='carry-over-months'
                value={[localValue]}
                max={MAX_VALUE}
                min={MIN_VALUE}
                step={1}
                onValueChange={handleChange}
              />
              <SlidingNumber
                className='absolute -bottom-4 left-0 w-full flex justify-center font-normal text-sm'
                number={localValue}
                padStart
              />
            </div>
            <p className='font-normal text-sm'>{MAX_VALUE}</p>
          </div>
        </PremiumFeature>
      </div>
    </AnimateIcon>
  );
};
