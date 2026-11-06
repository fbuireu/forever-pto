import { Textarea } from "@ui/modules/core/primitives/Textarea";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";

export const TextareaStatesDemo = () => (
	<Demo className="flex-col items-stretch">
		<Textarea placeholder="Type several lines, the field grows with its content." aria-label="Default textarea" />
		<Textarea defaultValue="Invalid value" aria-invalid="true" aria-label="Invalid textarea" />
	</Demo>
);

export const TEXTAREA_PROP_ROWS = propRows({
	"aria-invalid": {
		type: "boolean",
		description: "Drives the destructive border and focus shadow, exactly as on Input.",
	},
});
