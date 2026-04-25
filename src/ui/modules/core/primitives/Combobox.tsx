'use client';

import type { CountryDTO } from '@application/dto/country/types';
import type { RegionDTO } from '@application/dto/region/types';
import type { FilterStrategy } from '@infrastructure/services/calendar/types';
import { Popover, PopoverContent, PopoverTrigger } from '@ui/modules/core/animate/base/Popover';
import { Button } from '@ui/modules/core/animate/components/buttons/Button';
import { Check } from '@ui/modules/core/animate/icons/Check';
import { ChevronUpDown } from '@ui/modules/core/animate/icons/ChevronUpDown';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { cn } from '@ui/utils/utils';
import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './Command';
import { hasFlag } from './utils/helpers';

interface ComboboxProps extends Omit<React.HTMLProps<HTMLInputElement>, 'onChange'> {
  searchPlaceholder?: string;
  notFoundText?: string;
  options?: CountryDTO[] | RegionDTO[];
  value?: string;
  onChange: (value: FilterStrategy) => void;
}

export const Combobox = ({
  value = '',
  options = [],
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
      <PopoverTrigger asChild>
        <AnimateIcon animateOnHover asChild>
          <Button
            variant='outline'
            aria-expanded={open}
            aria-haspopup='listbox'
            id={id}
            disabled={disabled}
            aria-disabled={disabled ?? false}
            className={cn('w-[200px] justify-between', className)}
          >
            {selectedOption ? (
              <div className='flex items-center gap-2 min-w-0 flex-1'>
                {hasFlag(selectedOption) && <span className='flex-shrink-0'>{selectedOption.flag}</span>}
                <span className='truncate'>{selectedOption.label}</span>
              </div>
            ) : (
              placeholder
            )}
            <ChevronUpDown className='opacity-50' />
          </Button>
        </AnimateIcon>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' id='combobox-listbox'>
        <Command>
          <CommandInput placeholder={searchPlaceholder} className='h-9' />
          <CommandList>
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.label} onSelect={handleSelect}>
                  <div className='flex items-center gap-2'>
                    {hasFlag(option) && <span>{option.flag}</span>}
                    <span>{option.label}</span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      value.toLowerCase() === option.value.toLowerCase() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
