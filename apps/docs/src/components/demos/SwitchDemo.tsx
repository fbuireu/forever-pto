import { Switch } from "@ui/modules/core/animate/base/Switch";
import { Label } from "@ui/modules/core/primitives/Label";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const SwitchDemo = () => {
	const [checked, setChecked] = useState(true);
	const [allowPast, setAllowPast] = useState(false);

	return (
		<Demo>
			<div className="flex items-center gap-3">
				<Switch id="demo-carryover" checked={checked} onCheckedChange={(next) => setChecked(next)} />
				<Label htmlFor="demo-carryover">Analytics {checked ? "enabled" : "disabled"}</Label>
			</div>
			<div className="flex items-center gap-3">
				<Switch aria-label="Allow past days" checked={allowPast} onCheckedChange={(next) => setAllowPast(next)} />
				<span className="text-sm font-bold">Allow past days {allowPast ? "(on)" : "(off)"}</span>
			</div>
			<div className="flex items-center gap-3">
				<Switch id="demo-locked" checked disabled />
				<Label htmlFor="demo-locked" className="opacity-50">
					Essential, always on
				</Label>
			</div>
		</Demo>
	);
};

export const SWITCH_PROP_ROWS = propRows({
	checked: { type: "boolean", description: "Controlled state." },
	onCheckedChange: {
		type: "(checked: boolean, details) => void",
		description: "Base UI's signature, forwarded untouched.",
	},
	disabled: { type: "boolean", description: "Blocks interaction and dims the pill." },
	"id | aria-label": {
		type: "one of them, required",
		description: "The accessible name, enforced by the type: pair id with a Label, or name the switch directly.",
	},
});
