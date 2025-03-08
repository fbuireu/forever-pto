"use client";

import type { CountryDTO } from "@/application/dto/country/types";
import type { RegionDTO } from "@/application/dto/region/types";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createQueryString } from "@/shared/ui/utils/createQueryString";
import { mergeClass } from "@/shared/ui/utils/mergeClass";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { startTransition, useState } from "react";

interface ComboboxProps extends React.HTMLProps<HTMLInputElement> {
	searchPlaceholder?: string;
	notFoundText?: string;
	heading: string;
	type: "country" | "region";
	options?: CountryDTO[] | RegionDTO[];
	value?: string;
}

function hasFlag(option: CountryDTO | RegionDTO): option is CountryDTO {
	return "flag" in option && !!option.flag;
}

export const Combobox = ({
	value = "",
	label,
	options = [],
	placeholder,
	searchPlaceholder,
	notFoundText,
	className,
	heading,
	disabled,
	type,
}: ComboboxProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isOpen, setIsOpen] = useState(false);
	const selectedOption = options.find((option) => option.value.toLowerCase() === value.toLowerCase());

	const handleSelect = (currentValue: string) => {
		const selectedOption = options.find((option) => option.label === currentValue);
		if (selectedOption?.value) {
			const query = createQueryString({
				value: selectedOption.value.toLowerCase(),
				type,
				searchParams,
			});
			startTransition(() => {
				router.replace(`${pathname}?${query}`, { scroll: false });
				setIsOpen(false);
			});
		}
	};

	return (
		<div className="relative w-full">
			<p className="text-sm text-muted-foreground">{label}</p>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						disabled={disabled}
						aria-expanded={isOpen}
						className={mergeClass("w-full justify-between", className)}
					>
						{selectedOption ? (
							<div className="flex items-center gap-2">
								{hasFlag(selectedOption) && (
									<div className="relative h-4 w-6 overflow-hidden rounded">{selectedOption.flag}</div>
								)}
								<span>{selectedOption.label}</span>
							</div>
						) : (
							<span className="text-muted-foreground">{placeholder}</span>
						)}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) p-0">
					<Command className="w-full">
						<CommandInput placeholder={searchPlaceholder} />
						<CommandList>
							<CommandEmpty>{notFoundText}</CommandEmpty>
							<CommandGroup heading={heading} className="w-full">
								{options?.map((option) => (
									<CommandItem
										key={option.label}
										value={option?.label}
										className="hover:bg-slate-250 cursor-pointer rounded-md transition-colors duration-200"
										onSelect={handleSelect}
									>
										<div className="flex w-full items-center gap-2">
											{hasFlag(option) && <div className="relative h-4 w-6 overflow-hidden rounded">{option.flag}</div>}
											<span>{option.label}</span>
										</div>
										<Check
											className={mergeClass("ml-auto h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")}
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
