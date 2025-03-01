'use client';

import { startTransition, useCallback, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Combobox({
    value,
    onChange,
    options = [],
    label = 'Options',
    placeholder = 'Select an option',
    searchPlaceholder = 'Search options...',
    notFoundText = 'No results found.',
    className = '',
    disabled,
    type,
    ...props
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
            (name: string, value: string) => {
                const params = new URLSearchParams(searchParams.toString());
                if (name === 'country') {
                    params.set(name, value);
                    params.delete('region');
                } else {
                    params.set(name, value);
                }

                return params.toString();
            },
            [searchParams],
    );
    const [open, setOpen] = useState(false);

    const selectedOption = options.find((option) => option.value === value);

    return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                            variant="outline"
                            role="combobox"
                            disabled={disabled}
                            aria-expanded={open}
                            className={cn('w-full justify-between', className)}
                            {...props}
                    >
                        {selectedOption ? (
                                <div className="flex items-center gap-2">
                                    {selectedOption.flagUrl && (
                                            <div className="relative h-4 w-6 overflow-hidden rounded">
                                                <Image
                                                        src={selectedOption.flagUrl}
                                                        alt={`Bandera de ${selectedOption.label}`}
                                                        fill
                                                        className="object-cover"
                                                />
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
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandEmpty>{notFoundText}</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                            <CommandList>
                                {options?.map((option) => (
                                        <CommandItem
                                                key={option.label}
                                                value={option?.label}
                                                onSelect={(currentValue) => {
                                                    startTransition(() => {
                                                        const selectedOption = options.find(
                                                                option => option.label == currentValue);
                                                        router.push(
                                                                pathname + '?' +
                                                                createQueryString(type,
                                                                        selectedOption.value.toLowerCase()),
                                                                { scroll: false });

                                                        setOpen(false);
                                                    });
                                                }}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                {option.flagUrl && (
                                                        <div className="relative h-4 w-6 overflow-hidden rounded">
                                                            <Image
                                                                    src={option.flagUrl}
                                                                    alt={`Bandera de ${option.label}`}
                                                                    fill
                                                                    className="object-cover"
                                                            />
                                                        </div>
                                                )}
                                                <span>{option.label}</span>
                                            </div>
                                            <Check
                                                    className={cn(
                                                            'ml-auto h-4 w-4',
                                                            value === option.value ? 'opacity-100' : 'opacity-0',
                                                    )}
                                            />
                                        </CommandItem>
                                ))}
                            </CommandList>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
    );
}