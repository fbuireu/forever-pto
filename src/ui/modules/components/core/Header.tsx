'use client';

import {
  useAllowPastDays,
  useCarryOverMonths,
  usePtoDays,
  useSetAllowPastDays,
  useSetCarryOverMonths,
  useSetPtoDays,
  useSetYear,
  useYear,
} from '@application/stores/pto';
import { Button } from '@const/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@const/components/ui/command';
import { Slider } from '@const/components/ui/slider';
import { cn } from '@const/lib/utils';
import { Field, Label } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Counter } from 'src/components/animate-ui/components/counter';
import { Switch } from 'src/components/animate-ui/headless/switch';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';

const MAX_YEARS = 10;

export const Header = () => {
  const [open, setOpen] = useState(false);

  const carryOverMonths = useCarryOverMonths();
  const ptoDays = usePtoDays();
  const setPtoDays = useSetPtoDays();
  const year = useYear();
  const allowPastDays = useAllowPastDays();
  const setAllowPastDays = useSetAllowPastDays();
  const setYear = useSetYear();
  const setCarryOverMonths = useSetCarryOverMonths();

  const years = Array.from({ length: MAX_YEARS }, (_, i) => new Date().getFullYear() - MAX_YEARS / 2 + i);

  return (
    <div className='text-center'>
      <div className='mt-4'>
        <p className='text-xl mb-2'>
          PTO Days: <SlidingNumber number={ptoDays} padStart />
        </p>
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
            <Label className='text-sm font-medium'>
              Year <SlidingNumber number={year} padStart className='text-4xl' />
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={open}
                  className={cn('w-[200px] justify-between')}
                >
                  {year}
                  <ChevronsUpDown className='opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[200px] p-0'>
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {years.map((yearOption) => (
                        <CommandItem
                          key={yearOption}
                          value={String(yearOption)}
                          onSelect={() => {
                            setYear(String(yearOption));
                            setOpen(false);
                          }}
                        >
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
        <div>
          <p>1</p>
          <Slider value={[carryOverMonths]} max={12} step={1} onValueChange={(value) => setCarryOverMonths(value[0])} />
          <SlidingNumber number={carryOverMonths} padStart />
          <p>12</p>
        </div>
      </div>
    </div>
  );
};
