import { Input } from "@ui/modules/core/primitives/Input";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const InputStatesDemo = () => (
	<Demo className="flex-col items-stretch">
		<Input placeholder="Hover, then focus me" aria-label="Default input" />
		<Input defaultValue="Disabled" disabled aria-label="Disabled input" />
		<Input defaultValue="Invalid value" aria-invalid="true" aria-label="Invalid input" />
	</Demo>
);

export const InputTypesDemo = () => (
	<Demo className="flex-col items-stretch">
		<Input type="number" defaultValue={23} min={0} aria-label="PTO days" />
		<Input type="date" aria-label="Custom holiday date" />
		<Input type="file" aria-label="File input" />
	</Demo>
);

export const INPUT_PROP_ROWS = propRows({
	type: {
		type: "string",
		defaultValue: '"text"',
		description: "Any native input type. File inputs get their own file: pseudo-element styling.",
	},
	"aria-invalid": {
		type: "boolean",
		description:
			"Drives the destructive border and focus shadow. Set it from form state so styling and assistive technology agree.",
	},
	disabled: { type: "boolean", description: "Dims the field and drops the shadow states." },
});
