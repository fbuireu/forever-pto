import { Textarea } from "@ui/modules/core/primitives/Textarea";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const TextareaStatesDemo = () => (
	<Demo className="flex-col items-stretch">
		<Textarea placeholder="Type several lines, the field grows with its content." aria-label="Default textarea" />
		<Textarea defaultValue="Disabled" disabled aria-label="Disabled textarea" />
		<Textarea defaultValue="Invalid value" aria-invalid="true" aria-label="Invalid textarea" />
	</Demo>
);

export const TEXTAREA_PROP_ROWS = propRows({
	"aria-invalid": {
		type: "boolean",
		description: "Drives the destructive border and focus shadow, exactly as on Input.",
	},
	disabled: { type: "boolean", description: "Dims the field and drops the shadow states." },
	rows: {
		type: "number",
		description:
			"Ignored for sizing in practice: field-sizing: content grows the field with its text from the min-h-24 baseline.",
	},
});
