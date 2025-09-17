'use client';

import type { CountryDTO } from '@application/dto/country/types';
import type { RegionDTO } from '@application/dto/region/types';
import { cn } from '@const/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { hasFlag } from './utils/helpers';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { FilterStrategy } from '@infrastructure/services/calendar/types';

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
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-[200px] justify-between', className)}
        >
          {selectedOption ? (
            <div className='flex items-center gap-2'>
              {hasFlag(selectedOption) && <span>{selectedOption.flag}</span>}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
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
