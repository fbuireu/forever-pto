import { Button } from "@ui/modules/core/primitives/Button";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";
import type { VariantRow } from "../VariantsTable";

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;
type ButtonSize = NonNullable<ComponentProps<typeof Button>["size"]>;

const VARIANT_LABELS: Record<ButtonVariant, string> = {
	default: "Default",
	accent: "Accent",
	destructive: "Destructive",
	success: "Success",
	outline: "Outline",
	secondary: "Secondary",
	ghost: "Ghost",
};

const SIZE_LABELS: Record<ButtonSize, string> = {
	default: "Default",
	sm: "Small",
	lg: "Large",
	icon: "Icon",
};

const VARIANTS = Object.keys(VARIANT_LABELS) as ButtonVariant[];
const TEXT_SIZES = ["sm", "default", "lg"] as const satisfies readonly ButtonSize[];

export const BUTTON_VARIANT_ROWS: VariantRow[] = [
	{
		axis: "variant",
		values: VARIANTS,
		defaultValue: "default",
		notes: "ghost renders without border, shadow or hover lift.",
	},
	{
		axis: "size",
		values: Object.keys(SIZE_LABELS),
		defaultValue: "default",
		notes: "icon is square, for icon-only buttons.",
	},
];

export const ButtonVariantsDemo = () => (
	<Demo>
		{VARIANTS.map((variant) => (
			<Button key={variant} variant={variant}>
				{VARIANT_LABELS[variant]}
			</Button>
		))}
	</Demo>
);

export const ButtonSizesDemo = () => (
	<Demo>
		{TEXT_SIZES.map((size) => (
			<Button key={size} size={size}>
				{SIZE_LABELS[size]}
			</Button>
		))}
		<Button size="icon" aria-label={SIZE_LABELS.icon}>
			★
		</Button>
	</Demo>
);

export const ButtonStatesDemo = () => (
	<Demo>
		<Button>Hover me</Button>
		<Button disabled>Disabled</Button>
		<Button variant="outline" asChild>
			<a href="https://forever-pto.com" target="_blank" rel="noreferrer">
				asChild link
			</a>
		</Button>
	</Demo>
);

export const BUTTON_PROP_ROWS = propRows<OwnProps<ComponentProps<typeof Button>, ComponentProps<"button">>>({
	variant: {
		type: VARIANTS.map((variant) => `"${variant}"`).join(" | "),
		defaultValue: '"default"',
		description: "The visual recipe. ghost drops the frame, the shadow and the hover lift.",
	},
	size: {
		type: Object.keys(SIZE_LABELS)
			.map((size) => `"${size}"`)
			.join(" | "),
		defaultValue: '"default"',
		description: "Height and padding. icon is square, for a button holding only an icon.",
	},
	asChild: {
		type: "boolean",
		defaultValue: "false",
		description:
			"Render the single child element with the button's classes and props merged in, through the local Slot, so a link can look like a button without nesting interactive elements.",
	},
});
