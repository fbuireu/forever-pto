import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/modules/core/animate/base/DropdownMenu";
import { Button } from "@ui/modules/core/primitives/Button";
import { useState } from "react";
import { Demo } from "../Demo";

const THEMES = ["light", "dark", "system"];

export const DropdownMenuDemo = () => {
	const [theme, setTheme] = useState("system");

	return (
		<Demo>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant="outline">Theme</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{THEMES.map((option) => (
						<DropdownMenuItem key={option} className="flex justify-between" onClick={() => setTheme(option)}>
							{option}
							{theme === option && <span aria-hidden="true">✓</span>}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			<p className="m-0 font-mono text-sm">Selected: {theme}</p>
		</Demo>
	);
};
