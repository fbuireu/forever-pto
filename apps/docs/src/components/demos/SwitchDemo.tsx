import { Switch } from "@ui/modules/core/animate/base/Switch";
import { Label } from "@ui/modules/core/primitives/Label";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const SwitchDemo = () => {
	const [checked, setChecked] = useState(true);

	return (
		<Demo>
			<div className="flex items-center gap-3">
				<Switch id="demo-carryover" checked={checked} onCheckedChange={(next) => setChecked(next)} />
				<Label htmlFor="demo-carryover">Carryover {checked ? "enabled" : "disabled"}</Label>
			</div>
			<div className="flex items-center gap-3">
				<Switch id="demo-off" />
				<Label htmlFor="demo-off">Off by default</Label>
			</div>
			<div className="flex items-center gap-3">
				<Switch id="demo-locked" disabled defaultChecked />
				<Label htmlFor="demo-locked" className="opacity-50">
					Disabled
				</Label>
			</div>
		</Demo>
	);
};

export const SWITCH_PROP_ROWS = propRows({
	checked: { type: "boolean", description: "Controlled state." },
	defaultChecked: { type: "boolean", defaultValue: "false", description: "Uncontrolled initial state." },
	onCheckedChange: {
		type: "(checked: boolean, details) => void",
		description: "Base UI's signature, forwarded untouched.",
	},
	disabled: { type: "boolean", description: "Blocks interaction and dims the pill." },
	children: {
		type: "ReactNode",
		description: "Replaces the default thumb. Rarely needed; the thumb squashes while pressed on its own.",
	},
	"id | aria-label | aria-labelledby": {
		type: "one of them, required",
		description: "The accessible name, enforced by the type: pair id with a Label, or name the switch directly.",
	},
});
