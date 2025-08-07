'use client';

import { usePtoState } from '@application/stores/pto';
import { Slider } from '@const/components/ui/slider';
import { Field, Label } from '@headlessui/react';
import { InfoIcon, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';

const MIN_VALUE = 1;
const MAX_VALUE = 12;
const DEBOUNCE_DELAY = 300;

export const CarryOverMonths = () => {
  const { setCarryOverMonths, carryOverMonths } = usePtoState();
  const [localValue, setLocalValue] = useState(carryOverMonths);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setLocalValue(carryOverMonths);
  }, [carryOverMonths]);

  const handleChange = (value: number[]) => {
    const newValue = value[0];

    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setCarryOverMonths(newValue);
    }, DEBOUNCE_DELAY);
  };

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='carry-over-months'>
        <SlidersHorizontal size={16} /> Carry Over Months
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild className='ml-auto'>
              <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
            </TooltipTrigger>
            <TooltipContent className='w-50 text-pretty'>
              Allows adding months to the following year to expand opportunity search
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      <div className='flex gap-2 relative w-full'>
        <p className='font-normal text-sm'>{MIN_VALUE}</p>
        <Slider
          id='carry-over-months'
          value={[localValue]}
          max={MAX_VALUE}
          min={MIN_VALUE}
          step={1}
          onValueChange={handleChange}
        />
        <SlidingNumber
          className='absolute -bottom-4 left-0 right-0 mx-auto justify-center font-normal text-sm'
          number={localValue}
          padStart
        />
        <p className='font-normal text-sm'>{MAX_VALUE}</p>
      </div>
    </Field>
  );
};
