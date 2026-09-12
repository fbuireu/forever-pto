import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@ui/modules/core/primitives/InputGroup";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { propRows } from "../PropsTable";
import type { VariantRow } from "../VariantsTable";

type AddonAlign = NonNullable<ComponentProps<typeof InputGroupAddon>["align"]>;

// Exhaustive Record over the real `align` prop union (derived from the CVA
// object through the component's props): a renamed, added or removed align
// value in the app makes `astro check` fail here.
const ALIGN_LABELS: Record<AddonAlign, string> = {
	"inline-start": "Inline start",
	"inline-end": "Inline end",
	"block-start": "Block start",
	"block-end": "Block end",
};

const ALIGNS = Object.keys(ALIGN_LABELS) as AddonAlign[];

export const INPUT_GROUP_ADDON_ROWS: VariantRow[] = [
	{
		axis: "align (InputGroupAddon)",
		values: ALIGNS,
		defaultValue: "inline-start",
		notes: "block-* values switch the group to a column layout (addon above or below the control).",
	},
];

export const InputGroupAlignDemo = () => (
	<Demo className="flex-col items-stretch">
		{ALIGNS.map((align) => (
			<InputGroup key={align}>
				<InputGroupAddon align={align}>
					<InputGroupText>{ALIGN_LABELS[align]}</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput placeholder="Search holidays…" aria-label={`${ALIGN_LABELS[align]} example`} />
			</InputGroup>
		))}
	</Demo>
);

export const InputGroupComposedDemo = () => (
	<Demo className="flex-col items-stretch">
		<InputGroup>
			<InputGroupAddon>
				<Search />
			</InputGroupAddon>
			<InputGroupInput placeholder="Search…" aria-label="Search with icon and shortcut hint" />
			<InputGroupAddon align="inline-end">
				<kbd>⌘K</kbd>
			</InputGroupAddon>
		</InputGroup>
		<InputGroup>
			<InputGroupAddon>
				<InputGroupText>https://</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput placeholder="forever-pto.com" aria-invalid="true" aria-label="Invalid grouped input" />
		</InputGroup>
	</Demo>
);

export const INPUT_GROUP_ADDON_PROP_ROWS = propRows<AddonAlign>({
	"inline-start": {
		type: "align",
		defaultValue: "default",
		description: "Leading addon in the same row as the input: an icon, a currency sign, a prefix.",
	},
	"inline-end": {
		type: "align",
		description: "Trailing addon in the same row: a unit, a keyboard hint, a clear button.",
	},
	"block-start": { type: "align", description: "Full-width row above the input, for a caption or a helper line." },
	"block-end": { type: "align", description: "Full-width row below the input, for a counter or a hint." },
});
