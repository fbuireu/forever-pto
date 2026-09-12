import { Checkbox } from "@ui/modules/core/animate/base/Checkbox";
import { Label } from "@ui/modules/core/primitives/Label";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const CheckboxDemo = () => {
	const [checked, setChecked] = useState(true);

	return (
		<Demo>
			<div className="flex items-center gap-3">
				<Checkbox id="demo-holidays" checked={checked} onCheckedChange={(next) => setChecked(next)} />
				<Label htmlFor="demo-holidays">Include regional holidays {checked ? "(on)" : "(off)"}</Label>
			</div>
			<div className="flex items-center gap-3">
				<Checkbox id="demo-unchecked" />
				<Label htmlFor="demo-unchecked">Unchecked by default</Label>
			</div>
			<div className="flex items-center gap-3">
				<Checkbox id="demo-disabled" disabled defaultChecked />
				<Label htmlFor="demo-disabled" className="opacity-50">
					Disabled
				</Label>
			</div>
		</Demo>
	);
};

export const CHECKBOX_PROP_ROWS = propRows({
	checked: { type: "boolean", description: "Controlled state." },
	defaultChecked: { type: "boolean", defaultValue: "false", description: "Uncontrolled initial state." },
	onCheckedChange: {
		type: "(checked: boolean, details) => void",
		description: "Base UI's signature, forwarded untouched.",
	},
	disabled: { type: "boolean", description: "Halves the opacity and blocks interaction." },
	motionProps: {
		type: 'HTMLMotionProps<"button">',
		description: "Extra Motion props for the m.button root, on top of the tap and hover scales.",
	},
	"id | aria-label | aria-labelledby": {
		type: "one of them, required",
		description:
			"The accessible name. The type is a union that forces exactly one: pair id with a Label, or name the box directly.",
	},
});
