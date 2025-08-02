'use client';

import { useCarryOverMonths, useSetCarryOverMonths } from '@application/stores/pto';
import { Slider } from '@const/components/ui/slider';
import { Field, Label } from '@headlessui/react';
import { InfoIcon, SlidersHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';

const MIN_VALUE = 1;
const MAX_VALUE = 12;

export const CarryOverMonths = () => {
  const carryOverMonths = useCarryOverMonths();

  const setCarryOverMonths = useSetCarryOverMonths();

  return (
    <Field className='space-y-2'>
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
      <div className='flex gap-2 relative'>
        <p className='font-normal text-sm'>{MIN_VALUE}</p>
        <Slider
          id='carry-over-months'
          value={[carryOverMonths]}
          max={MAX_VALUE}
          min={MIN_VALUE}
          step={1}
          onValueChange={(value) => setCarryOverMonths(value[0])}
        />
        <SlidingNumber
          className='absolute -bottom-4 left-0 right-0 mx-auto justify-center'
          number={carryOverMonths}
          padStart
        />
        <p className='font-normal text-sm'>{MAX_VALUE}</p>
      </div>
    </Field>
  );
};
