import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/modules/core/animate/base/Dialog";
import { Button } from "@ui/modules/core/primitives/Button";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const DialogDemo = () => {
	const [open, setOpen] = useState(false);

	return (
		<Demo>
			<Button variant="destructive" onClick={() => setOpen(true)}>
				Delete holiday
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-sm" closeLabel="Close">
					<DialogHeader>
						<DialogTitle className="text-destructive">Delete holiday</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this holiday? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="destructive" className="flex-1" onClick={() => setOpen(false)}>
							Delete
						</Button>
						<Button variant="destructive" className="flex-1" onClick={() => setOpen(false)}>
							Cancel
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
		description: "Fires on the close button, Esc and a backdrop click.",
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
