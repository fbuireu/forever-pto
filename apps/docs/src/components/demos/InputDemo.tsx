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
		<Input type="text" placeholder="Holiday name" aria-label="Holiday name" />
		<Input type="email" defaultValue="you@example.com" aria-label="Email" />
	</Demo>
);

export const INPUT_PROP_ROWS = propRows({
	type: {
		type: "string",
		defaultValue: '"text"',
		description: "The app sets text and email.",
	},
	"aria-invalid": {
		type: "boolean",
		description:
			"Drives the destructive border and focus shadow. Set it from form state so styling and assistive technology agree.",
	},
	disabled: { type: "boolean", description: "Dims the field and drops the shadow states." },
});
