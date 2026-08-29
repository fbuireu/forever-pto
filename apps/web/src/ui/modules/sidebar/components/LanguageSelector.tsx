"use client";

import { useLanguageSwitch } from "@ui/hooks/useLanguageSwitch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/modules/core/animate/base/DropdownMenu";
import { useSidebar } from "@ui/modules/core/animate/base/Sidebar";
import { Check } from "@ui/modules/core/animate/icons/Check";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { Button } from "@ui/modules/core/primitives/Button";

export const LanguageSelector = () => {
	const { locale, languages, currentLanguage, selectLanguage, switcherLabel } = useLanguageSwitch();
	const { state } = useSidebar();
	const displayText = state === "collapsed" ? currentLanguage?.code : currentLanguage?.label;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<AnimateIcon animateOnHover asChild>
					<Button
						variant="outline"
						size="icon"
						className="w-full h-11! focus-visible:ring-1"
						aria-label={switcherLabel}
					>
						<span className="capitalize">{displayText}</span>
					</Button>
				</AnimateIcon>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{languages.map((language) => (
					<DropdownMenuItem
						key={language.code}
						className="flex justify-between"
						onClick={() => selectLanguage(language.code)}
					>
						<span>{language.label}</span>
						{language.code === locale && <Check className="size-4" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
