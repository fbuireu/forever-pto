'use client';

import { usePtoState } from '@application/stores/pto';
import { cn } from '@const/lib/utils';
import { Field, Label } from '@headlessui/react';
import { useDebounce } from '@ui/hooks/useDebounce';
import { CalendarDays } from 'lucide-react';
import { Counter } from 'src/components/animate-ui/components/counter';

const MIN_VALUE = 1;
const MAX_VALUE = 365;

export const PtoDays = () => {
  const { setPtoDays, ptoDays } = usePtoState();
  const [localValue, setLocalValue] = useDebounce({ value: ptoDays, delay: 100, callback: setPtoDays });
  const isDecrementDisabled = localValue <= MIN_VALUE;
  const isIncrementDisabled = localValue >= MAX_VALUE;

  const handleChange = (value: number) => {
    setLocalValue(Math.max(MIN_VALUE, value));
  };

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='pto-days'>
        <CalendarDays size={16} /> PTO Days
      </Label>
      <div className='flex items-center font-normal gap-2 justify-between'>
        <p className='font-normal text-sm'>I have</p>
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
        <p className='font-normal text-sm'>days</p>
      </div>
    </Field>
  );
};
