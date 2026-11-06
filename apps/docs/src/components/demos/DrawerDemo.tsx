import { Drawer, DrawerContent, DrawerTitle } from "@ui/modules/core/animate/base/Drawer";
import { Button } from "@ui/modules/core/primitives/Button";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const DrawerDemo = () => {
	const [open, setOpen] = useState(false);

	return (
		<Demo>
			<Button onClick={() => setOpen(true)}>Open drawer</Button>
			<Drawer open={open} modal={false} dismissible={false}>
				<DrawerContent role="region">
					<DrawerTitle>Demo drawer</DrawerTitle>
					<div className="mx-auto w-full max-w-md space-y-3 p-6 pb-10 text-sm">
						<p className="m-0 font-bold">A vaul bottom sheet</p>
						<p className="m-0 text-muted-foreground">
							The app uses it for the mobile planner panel: not modal, not dismissible, resting at snap points.
						</p>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Close
						</Button>
					</div>
				</DrawerContent>
			</Drawer>
		</Demo>
	);
};

export const DRAWER_PROP_ROWS = propRows({
	open: { type: "boolean", description: "Controlled state; there is no trigger export, so this is how it opens." },
	modal: {
		type: "boolean",
		defaultValue: "true",
		description: "The app passes false, so the page behind the sheet stays reachable.",
	},
	dismissible: {
		type: "boolean",
		defaultValue: "true",
		description: "The app passes false: the sheet moves between snap points and never closes by dragging.",
	},
	snapPoints: { type: "number[]", description: "The heights the sheet rests at, as fractions of the viewport." },
	activeSnapPoint: { type: "number | null", description: "Controlled snap point." },
	setActiveSnapPoint: {
		type: "(snap: number | null) => void",
		description: "Fires when a drag settles on a snap point.",
	},
});
