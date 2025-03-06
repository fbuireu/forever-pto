'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useState } from 'react';
import { mergeClass } from '@/shared/ui/utils/mergeClass';
import { CountryDTO } from '@/application/dto/country/types';
import { createQueryString } from '@/shared/ui/utils/createQueryString';
import { RegionDTO } from '@/application/dto/region/types';

interface ComboboxProps extends React.HTMLProps<HTMLInputElement> {
    searchPlaceholder?: string;
    notFoundText?: string;
    heading: string;
    type: 'country' | 'region';
    options?: CountryDTO[] | RegionDTO[];
}

export const Combobox: React.FC<ComboboxProps> = ({
    value = "",
    label,
    onChange,
    options = [],
    placeholder,
    searchPlaceholder,
    notFoundText,
    className,
    heading,
    disabled,
    type,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((option) => option.value.toLowerCase() === value?.toLowerCase());

    return (
        <div className="relative w-full">
            <p className="text-sm text-muted-foreground">{label}</p>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        disabled={disabled}
                        aria-expanded={isOpen}
                        className={mergeClass('w-full justify-between', className)}
                    >
                        {selectedOption ? (
                            <div className="flex items-center gap-2">
                                {selectedOption.flag && (
                                    <div className="relative h-4 w-6 overflow-hidden rounded">
                                        {selectedOption.flag}
                                    </div>
                                )}
                                <span>{selectedOption.label}</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                    <Command className="w-full">
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList>
                            <CommandEmpty>{notFoundText}</CommandEmpty>
                            <CommandGroup heading={heading} className="w-full">
                                {options?.map((option) => (
                                    <CommandItem
                                        key={option.label}
                                        value={option?.label}
                                        className="rounded-md cursor-pointer hover:bg-slate-250 transition-colors duration-200"
                                        onSelect={(currentValue) => {
                                            startTransition(() => {
                                                const selectedOption = options.find((option): option is CountryDTO | RegionDTO =>
                                                    option.label == currentValue
                                                );
                                                if (selectedOption) {
                                                    const query = createQueryString({ value: selectedOption.value.toLowerCase(), type, searchParams })
                                                    router.replace(`${pathname}?${query}`,{ scroll: false });
                                                    setIsOpen(false);
                                                }
                                            });
                                        }}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            {option.flag && (
                                                <div className="relative h-4 w-6 overflow-hidden rounded">
                                                    {option.flag}
                                                </div>
                                            )}
                                            <span>{option.label}</span>
                                        </div>
                                        <Check
                                            className={mergeClass(
                                                'ml-auto h-4 w-4',
                                                value === option.value ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};