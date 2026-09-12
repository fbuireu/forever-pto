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
				<DialogContent>
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

export const DialogNoCloseButtonDemo = () => (
	<Demo>
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Without close button</Button>
			</DialogTrigger>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>No X in the corner</DialogTitle>
					<DialogDescription>Dismiss with Esc or by clicking the backdrop.</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	</Demo>
);

export const DIALOG_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state." },
	defaultOpen: { type: "boolean", defaultValue: "false", description: "Uncontrolled initial state." },
	onOpenChange: {
		type: "(open: boolean, details) => void",
		description: "Fires on trigger, close button, Esc and backdrop click.",
	},
	modal: { type: "boolean", defaultValue: "true", description: "Whether the rest of the page is inert while open." },
});

export const DIALOG_CONTENT_PROP_ROWS = propRows({
	showCloseButton: {
		type: "boolean",
		defaultValue: "true",
		description: "Whether the top-right X renders. Off, Esc and the backdrop still dismiss.",
	},
	closeLabel: {
		type: "string",
		defaultValue: '"Close"',
		description: "Screen-reader text of the X. Pass a translated string; the default is English.",
	},
});
