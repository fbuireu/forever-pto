'use client';

import type { CountryDTO } from '@application/dto/country/types';
import type { RegionDTO } from '@application/dto/region/types';
import type { FilterStrategy } from '@domain/calendar/types';
import { Popover, PopoverContent, PopoverTrigger } from '@ui/modules/core/animate/base/Popover';
import { ChevronUpDown } from '@ui/modules/core/animate/icons/ChevronUpDown';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Button } from '@ui/modules/core/primitives/Button';
import { cn } from '@ui/utils/cn';
import { Check } from 'lucide-react';
import { type HTMLProps, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './Command';
import { FlagIcon } from './FlagIcon';
import { hasFlag } from './utils/helpers';

interface ComboboxProps extends Omit<HTMLProps<HTMLInputElement>, 'onChange'> {
  searchPlaceholder?: string;
  notFoundText?: string;
  options?: CountryDTO[] | RegionDTO[];
  value?: string;
  onChange: (value: FilterStrategy) => void;
}

const EMPTY_OPTIONS: CountryDTO[] | RegionDTO[] = [];

export const Combobox = ({
  value = '',
  options = EMPTY_OPTIONS,
  placeholder,
  searchPlaceholder,
  notFoundText,
  className,
  disabled,
  id,
  onChange,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((option) => option.value.toLowerCase() === value.toLowerCase());

  const handleSelect = (selectedLabel: string) => {
    const option = options.find((opt) => opt.label === selectedLabel);
    if (option) {
      if (option.value.toLowerCase() !== value.toLowerCase()) {
        onChange(option.value.toLowerCase() as FilterStrategy);
      }
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <AnimateIcon animateOnHover={!open} animate={open}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            aria-expanded={open}
            aria-haspopup='listbox'
            id={id}
            disabled={disabled}
            aria-disabled={disabled ?? false}
            className={cn('w-[200px] justify-between', className)}
            data-popup-open={open || undefined}
          >
            <span className='truncate min-w-0 flex-1 text-left'>
              {selectedOption ? (
                <span className='flex items-center gap-2'>
                  {hasFlag(selectedOption) && <FlagIcon code={selectedOption.flag} />}
                  <span className='truncate capitalize'>{selectedOption.label}</span>
                </span>
              ) : (
                placeholder
              )}
            </span>
            <ChevronUpDown className='opacity-50 shrink-0' />
          </Button>
        </PopoverTrigger>
      </AnimateIcon>
      <PopoverContent className='w-[200px] p-0' id='combobox-listbox'>
        <Command>
          <CommandInput placeholder={searchPlaceholder} className='h-9' />
          <CommandList>
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.label} onSelect={handleSelect}>
                  <div className='flex items-center gap-2'>
                    {hasFlag(option) && <FlagIcon code={option.flag} />}
                    <span className='capitalize'>{option.label}</span>
                  </div>
                  {value.toLowerCase() === option.value.toLowerCase() && <Check className='ml-auto' />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
