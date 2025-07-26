"use client";

import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { hasFlag } from "@modules/components/core/combobox/utils/hasFlag/hasFlag";
import { CommandEmpty } from "@modules/components/core/command/atoms/commandEmpty/CommandEmpty";
import { CommandGroup } from "@modules/components/core/command/atoms/commandGroup/CommandGroup";
import { CommandInput } from "@modules/components/core/command/atoms/commandInput/CommandInput";
import { CommandItem } from "@modules/components/core/command/atoms/commandItem/CommandItem";
import { CommandList } from "@modules/components/core/command/atoms/commandList/CommandList";
import { PopoverContent } from "@modules/components/core/popover/atoms/popoverContent/PopoverContent";
import { PopoverTrigger } from "@modules/components/core/popover/atoms/popoverTrigger/PopoverTrigger";
import { Popover } from "@modules/components/core/popover/Popover";
import { useFilterAction } from "@ui/hooks/useFilterAction/useFilterAction";
import { Button } from "@ui/modules/components/core/button/Button";
import { Command } from "@ui/modules/components/core/command/Command";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { Check, ChevronsUpDown } from "lucide-react";
import type { HTMLProps } from "react";
import { useCallback, useMemo, useState } from "react";

interface ComboboxProps extends HTMLProps<HTMLInputElement> {
	searchPlaceholder?: string;
	notFoundText?: string;
	heading: string;
	type: "country" | "region";
	options?: CountryDTO[] | RegionDTO[];
	value?: string;
}

export const Combobox = ({
	value = "",
	options = [],
	placeholder,
	searchPlaceholder,
	notFoundText,
	className,
	heading,
	disabled,
	type,
}: ComboboxProps) => {
	const { updateFilter, isPending } = useFilterAction();
	const [isOpen, setIsOpen] = useState(false);

	const selectedOption = useMemo(
		() => options.find((option) => option.value.toLowerCase() === value.toLowerCase()),
		[options, value],
	);

	const handleSelect = useCallback(
		(selectedLabel: string) => {
			const selectedOption = options.find((option) => option.label === selectedLabel);
			if (!selectedOption) return;

			setIsOpen(false);
			updateFilter(type, selectedOption.value.toLowerCase());
		},
		[options, type, updateFilter],
	);

	const commandItems = useMemo(
		() =>
			options?.map((option) => (
				<CommandItem
					key={option.label}
					value={option?.label}
					className={mergeClasses(
						"hover:bg-slate-250 cursor-pointer rounded-md transition-colors duration-200",
						value?.toLowerCase() === option.value.toLowerCase() && "bg-slate-250",
					)}
					onSelect={handleSelect}
				>
					<div className="flex w-full items-center gap-2">
						{hasFlag(option) && <div className="relative h-4 w-6 overflow-hidden rounded">{option.flag}</div>}
						<span>{option.label}</span>
					</div>
					<Check
						className={mergeClasses(
							"ml-auto h-4 w-4",
							value?.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0",
						)}
					/>
				</CommandItem>
			)),
		[options, value, handleSelect],
	);

	const triggerContent = useMemo(() => {
		if (selectedOption) {
			return (
				<div className="flex items-center gap-2">
					{hasFlag(selectedOption) && (
						<div className="relative h-4 w-6 overflow-hidden rounded">{selectedOption.flag}</div>
					)}
					<span>{selectedOption.label}</span>
				</div>
			);
		}
		return <span className="text-muted-foreground">{placeholder}</span>;
	}, [selectedOption, placeholder]);

	return (
		<div className={`relative w-full ${isPending ? "opacity-50" : ""}`}>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						disabled={disabled || isPending}
						aria-expanded={isOpen}
						className={mergeClasses("w-full justify-between", className)}
					>
						{triggerContent}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) p-0">
					<Command className="w-full">
						<CommandInput placeholder={searchPlaceholder} />
						<CommandList>
							<CommandEmpty>{notFoundText}</CommandEmpty>
							<CommandGroup heading={heading} className="w-full">
								{commandItems}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};
