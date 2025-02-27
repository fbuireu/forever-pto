"use client";

import React, { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

export default function Combobox({
  value = "",
  onChange,
  options = [],
  placeholder = "Selecciona...",
  label,
  searchPlaceholder = "Buscar...",
  notFoundText = "No encontrado.",
  className,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const displayLabel = value
      ? options.find((option) => option?.value === value)?.label : placeholder;

  return (
      <div className={cn("flex items-center gap-2", className)}>
        {label && (
            <Label htmlFor={id} className={cn("whitespace-nowrap")}>
              {label}
            </Label>
        )}
        <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
          <PopoverTrigger asChild>
            <Button
                id={id}
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-label={label}
                aria-haspopup="listbox"
                disabled={disabled}
                className={cn("justify-between w-36")}
            >
              {displayLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-36 p-0")} align="start">
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{notFoundText}</CommandEmpty>
                <CommandGroup heading={label}>
                  {options.map((option) => (
                      <CommandItem
                          key={option.value}
                          value={option?.label}
                          onSelect={() => {
                            onChange(option.value);
                            setOpen(false);
                          }}
                          aria-selected={value === option?.value}
                      >
                        <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                value === option?.value ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {option?.label}
                      </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
  );
}