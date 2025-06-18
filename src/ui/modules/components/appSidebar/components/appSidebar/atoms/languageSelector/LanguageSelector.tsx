"use client";

import { useLanguages } from "@modules/components/appSidebar/components/appSidebar/atoms/languageSelector/hooks/useLanguages/useLanguages";
import { Button } from "@modules/components/core/button/Button";
import { DropdownMenuContent } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuItem/DropdownMenuItem";
import { DropdownMenuTrigger } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuTrigger/DropdownMenuTrigger";
import { DropdownMenu } from "@modules/components/core/dropdownMenu/DropdownMenu";
import { useSidebar } from "@modules/components/core/sidebar/hooks/useSidebar/useSidebar";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export const LanguageSelector = () => {
	const t = useTranslations("languages");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const { state } = useSidebar();
	const languages = useLanguages();

	const handleLanguageChange = (newLocale: string) => {
		const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
		router.push(newPathname);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" className="w-full">
					<span className="capitalize">{state === "collapsed" ? locale : t(locale)}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{languages.map((language) => (
					<DropdownMenuItem
						key={language.code}
						onClick={() => handleLanguageChange(language.code)}
						className={mergeClasses("flex items-center justify-between", language.code === locale && "bg-accent")}
					>
						<span>{language.label}</span>
						{language.code === locale && <Check className="h-4 w-4" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
