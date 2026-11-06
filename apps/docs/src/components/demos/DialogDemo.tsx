import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/modules/core/animate/base/Dialog";
import { Button } from "@ui/modules/core/primitives/Button";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const DialogDemo = () => {
	const [open, setOpen] = useState(false);

	return (
		<Demo>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button>Open dialog</Button>
				</DialogTrigger>
				<DialogContent closeLabel="Close dialog">
					<DialogHeader>
						<DialogTitle>Reset your plan?</DialogTitle>
						<DialogDescription>
							This clears every manually edited suggestion and recalculates from scratch.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={() => setOpen(false)}>
							Reset plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Demo>
	);
};

export const DIALOG_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state." },
	onOpenChange: {
		type: "(open: boolean, details) => void",
		description: "Fires on trigger, close button, Esc and backdrop click.",
	},
});

export const DIALOG_CONTENT_PROP_ROWS = propRows({
	closeLabel: {
		type: "string",
		description: "Screen-reader text of the X. Required, and a translated string: the component cannot translate.",
	},
	initialFocus: {
		type: "boolean",
		description:
			"Passed to the popup as Base UI's initial-focus setting; the app passes false where focus on open would scroll or pop a keyboard.",
	},
});
