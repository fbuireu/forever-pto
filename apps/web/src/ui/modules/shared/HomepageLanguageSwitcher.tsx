"use client";

import { useLanguageSwitch } from "@ui/hooks/useLanguageSwitch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/modules/core/animate/base/DropdownMenu";
import { Check } from "@ui/modules/core/animate/icons/Check";
import { Button } from "@ui/modules/core/primitives/Button";

export const HomepageLanguageSwitcher = () => {
	const { locale, languages, currentLanguage, selectLanguage, switcherLabel } = useLanguageSwitch();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="focus-visible:ring-1" aria-label={switcherLabel}>
					<span className="capitalize">{currentLanguage?.label}</span>
				</Button>
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
