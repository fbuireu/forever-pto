'use client';

import { usePtoDays, useSetPtoDays } from '@application/stores/pto';
import { Field, Label } from '@headlessui/react';
import { CalendarDays } from 'lucide-react';
import { Counter } from 'src/components/animate-ui/components/counter';

export const PtoDays = () => {
  const setPtoDays = useSetPtoDays();
  const ptoDays = usePtoDays();

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='pto-days'>
        <CalendarDays size={16} /> PTO Days
      </Label>
      <div className='flex items-center font-normal gap-2 justify-between'>
        <p className='font-normal text-sm'>I have</p>
        <Counter
          id='pto-days'
          number={ptoDays}
          setNumber={setPtoDays}
          slidingNumberProps={{ className: 'font-normal text-base' }}
        />
        <p className='font-normal text-sm'>days</p>
      </div>
    </Field>
  );
};
