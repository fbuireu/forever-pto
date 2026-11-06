import { Checkbox } from "@ui/modules/core/animate/base/Checkbox";
import { useState } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

const HOLIDAYS = ["New Year's Day", "Labour Day", "Christmas Day"];

export const CheckboxDemo = () => {
	const [selected, setSelected] = useState<string[]>([HOLIDAYS[0]]);

	const toggle = (holiday: string) =>
		setSelected((current) =>
			current.includes(holiday) ? current.filter((name) => name !== holiday) : [...current, holiday],
		);

	const toggleAll = () => setSelected(selected.length === HOLIDAYS.length ? [] : HOLIDAYS);

	return (
		<Demo className="flex-col items-start">
			<div className="flex items-center gap-3 text-sm font-bold">
				<Checkbox
					checked={selected.length === HOLIDAYS.length}
					indeterminate={selected.length > 0 && selected.length < HOLIDAYS.length}
					onCheckedChange={toggleAll}
					aria-label="Select all holidays"
				/>
				Select all
			</div>
			{HOLIDAYS.map((holiday) => (
				<div key={holiday} className="flex items-center gap-3 text-sm">
					<Checkbox
						checked={selected.includes(holiday)}
						onCheckedChange={() => toggle(holiday)}
						aria-label={`Select ${holiday}`}
					/>
					{holiday}
				</div>
			))}
		</Demo>
	);
};

export const CHECKBOX_PROP_ROWS = propRows({
	checked: { type: "boolean", description: "Controlled state." },
	indeterminate: {
		type: "boolean",
		description: "Shows the partial state of a select-all box, while only some of its rows are selected.",
	},
	onCheckedChange: {
		type: "(checked: boolean, details) => void",
		description: "Base UI's signature, forwarded untouched.",
	},
	"aria-label": {
		type: "string",
		description: "The accessible name, required by the type: the box is a button with no text of its own.",
	},
});
