"use client";

import { DropdownMenuContent } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuItem/DropdownMenuItem";
import { DropdownMenuTrigger } from "@modules/components/core/dropdownMenu/atoms/dropdownMenuTrigger/DropdownMenuTrigger";
import { Button } from "@ui/modules/components/core/button/Button";
import { DropdownMenu } from "@ui/modules/components/core/dropdownMenu/DropdownMenu";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

const THEME_ICONS = new Map([
	["light", Sun],
	["dark", Moon],
	["system", MonitorCog],
]);

export const ThemeToggle = () => {
	const { setTheme, theme, themes } = useTheme();
	const t = useTranslations("theme");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" className="w-full">
					<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{themes.map((themeName) => {
					const IconComponent = THEME_ICONS.get(themeName);
					return (
						<DropdownMenuItem
							key={themeName}
							onClick={() => setTheme(themeName)}
							className={mergeClasses("flex items-center justify-between", theme === themeName && "bg-accent")}
						>
							{t(themeName as Parameters<typeof t>[0])}
							{IconComponent && <IconComponent className="h-4 w-4" />}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
