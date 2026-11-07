import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/modules/core/animate/base/DropdownMenu";
import { Button } from "@ui/modules/core/primitives/Button";
import { Check, Sun } from "lucide-react";
import { useState } from "react";
import { Demo } from "../Demo";

const THEMES = [
	{ id: "light", label: "Light" },
	{ id: "dark", label: "Dark" },
	{ id: "system", label: "System" },
];

export const DropdownMenuDemo = () => {
	const [theme, setTheme] = useState("system");

	return (
		<Demo>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant="outline" size="icon">
						<Sun />
						<span className="sr-only">Toggle theme</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{THEMES.map(({ id, label }) => (
						<DropdownMenuItem key={id} className="flex justify-between" onClick={() => setTheme(id)}>
							{label}
							{theme === id && <Check className="size-4" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</Demo>
	);
};
