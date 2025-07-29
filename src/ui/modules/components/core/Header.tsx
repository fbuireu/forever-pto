'use client';

import {
  useAllowPastDays,
  usePtoDays,
  useSetAllowPastDays,
  useSetPtoDays,
  useSetYear,
  useYear,
} from '@application/stores/pto';
import { Button } from '@const/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@const/components/ui/command';
import { cn } from '@const/lib/utils';
import { Field, Label } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Counter } from 'src/components/animate-ui/components/counter';
import { Switch } from 'src/components/animate-ui/headless/switch';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';

const MAX_YEARS = 10;

export const Header = () => {
  const [open, setOpen] = useState(false);

  const ptoDays = usePtoDays();
  const setPtoDays = useSetPtoDays();
  const year = useYear();
  const allowPastDays = useAllowPastDays();
  const setAllowPastDays = useSetAllowPastDays();
  const setYear = useSetYear();

  const years = Array.from({ length: MAX_YEARS }, (_, i) => new Date().getFullYear() - MAX_YEARS / 2 + i);

  return (
    <div className='text-center'>
      <div className='mt-4'>
        <p className='text-xl mb-2'>PTO Days: {ptoDays}</p>
        <Counter number={ptoDays} setNumber={setPtoDays} />
        <Field className='flex items-center space-x-2'>
          <Label htmlFor='allow-past-days' className='text-sm font-medium'>
            Allow past days
          </Label>
          <Switch
            defaultChecked={allowPastDays}
            id='allow-past-days'
            onChange={(checked) => setAllowPastDays(checked as boolean)}
          />
        </Field>
        <div className='mt-4'>
          <Field>
            <Label className='text-sm font-medium'>Year</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={open}
                  className={cn('w-[200px] justify-between')}
                >
                  <span>{year}</span>
                  <ChevronsUpDown className='opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[200px] p-0'>
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {years.map((yearOption) => (
                        <CommandItem key={yearOption} value={String(yearOption)} onSelect={()=>{
                          setYear(String(yearOption));
                          setOpen(false);
                        }}>
                          <span>{yearOption}</span>
                          <Check className={cn('ml-auto', Number(year) === yearOption ? 'opacity-100' : 'opacity-0')} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>
        </div>
      </div>
    </div>
  );
};
