'use client';

import { useFiltersStore } from '@application/stores/filters';
import { Command, CommandGroup, CommandItem, CommandList } from '@const/components/ui/command';
import { cn } from '@const/lib/utils';
import { Field, Label } from '@headlessui/react';
import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Check } from 'src/components/animate-ui/icons/check';
import { ChevronDown } from 'src/components/animate-ui/icons/chevron-down';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';
import { useShallow } from 'zustand/react/shallow';

const MAX_YEARS = 10;

export const Years = () => {
  const t = useTranslations('sidebar.years');
  const [open, setOpen] = useState(false);
  const { year, setYear } = useFiltersStore(
    useShallow((state) => ({
      year: state.year,
      setYear: state.setYear,
    }))
  );

  const years = Array.from({ length: MAX_YEARS }, (_, index) => new Date().getFullYear() - MAX_YEARS / 2 + index);

  return (
    <Field className='space-y-2 w-full' data-tutorial='year'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='years'>
        <Calendar size={16} /> {t('title')}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <AnimateIcon animateOnHover>
            <Button variant='outline' role='combobox' aria-expanded={open} className={cn('w-full justify-between')}>
              {year}
              <ChevronDown className={cn('opacity-50 transition-transform duration-200', open && 'rotate-180')} />
            </Button>
          </AnimateIcon>
        </PopoverTrigger>
        <PopoverContent className='w-50 p-0'>
          <Command id='years'>
            <CommandList>
              <CommandGroup>
                {years.map((yearOption) => (
                  <AnimateIcon animateOnHover key={yearOption}>
                    <CommandItem
                      key={yearOption}
                      value={String(yearOption)}
                      onSelect={() => {
                        setYear(String(yearOption));
                        setOpen(false);
                      }}
                    >
                      <p className='font-normal text-sm'>{yearOption}</p>
                      <Check
                        animateOnHover
                        className={cn('ml-auto', Number(year) === yearOption ? 'opacity-100' : 'opacity-0')}
                      />
                    </CommandItem>
                  </AnimateIcon>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
};
