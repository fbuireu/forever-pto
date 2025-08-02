'use client';

import { useSetYear, useYear } from '@application/stores/pto';
import { Button } from '@const/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@const/components/ui/command';
import { cn } from '@const/lib/utils';
import { Field, Label } from '@headlessui/react';
import { Calendar, Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';

const MAX_YEARS = 10;

export const Years = () => {
  const [open, setOpen] = useState(false);

  const year = useYear();
  const setYear = useSetYear();
  const years = Array.from({ length: MAX_YEARS }, (_, index) => new Date().getFullYear() - MAX_YEARS / 2 + index);

  return (
    <Field className='space-y-2'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='years'>
        <Calendar size={16} /> Year
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant='outline' role='combobox' aria-expanded={open} className={cn('w-[200px] justify-between')}>
            {year}
            <ChevronsUpDown className='opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[200px] p-0'>
          <Command id='years'>
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
  );
};
