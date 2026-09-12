import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/modules/core/animate/base/DropdownMenu";
import { Button } from "@ui/modules/core/primitives/Button";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const DropdownMenuDemo = () => {
	const [lastAction, setLastAction] = useState("none yet");

	return (
		<Demo>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline">Holiday actions</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={() => setLastAction("edit")}>Edit holiday</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setLastAction("duplicate")}>Duplicate</DropdownMenuItem>
					<DropdownMenuItem disabled>Export (disabled)</DropdownMenuItem>
					<DropdownMenuItem variant="destructive" onClick={() => setLastAction("delete")}>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<p className="m-0 font-mono text-sm">Last action: {lastAction}</p>
		</Demo>
	);
};

export const DROPDOWN_MENU_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state." },
	defaultOpen: { type: "boolean", defaultValue: "false", description: "Uncontrolled initial state." },
	onOpenChange: {
		type: "(open: boolean, details) => void",
		description: "Fires on trigger, item selection, Esc and outside click.",
	},
	transition: {
		type: "Transition",
		defaultValue: '{ type: "spring", stiffness: 350, damping: 35 }',
		description: "Spring of the content's scale-in and of the hover pill.",
	},
	animateOnHover: {
		type: "boolean",
		defaultValue: "true",
		description: "Whether the MotionHighlight pill follows the hovered item.",
	},
});

export const DROPDOWN_MENU_CONTENT_PROP_ROWS = propRows({
	sideOffset: { type: "number", description: "Gap between the trigger and the menu, in pixels." },
	align: {
		type: '"start" | "center" | "end"',
		description: "Alignment along the trigger's edge, from Base UI's positioner.",
	},
});
