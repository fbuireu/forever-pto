import { Badge } from "@ui/modules/core/primitives/Badge";
import type { ComponentProps } from "react";
import { Demo } from "../Demo";
import { type OwnProps, propRows } from "../PropsTable";
import type { VariantRow } from "../VariantsTable";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const VARIANT_LABELS: Record<BadgeVariant, string> = {
	default: "Default",
	secondary: "Secondary",
	destructive: "Destructive",
	outline: "Outline",
};

const VARIANTS = Object.keys(VARIANT_LABELS) as BadgeVariant[];

export const BADGE_VARIANT_ROWS: VariantRow[] = [
	{
		axis: "variant",
		values: VARIANTS,
		defaultValue: "default",
		notes: "No size axis: a single fixed pill size.",
	},
];

export const BadgeVariantsDemo = () => (
	<Demo>
		{VARIANTS.map((variant) => (
			<Badge key={variant} variant={variant}>
				{VARIANT_LABELS[variant]}
			</Badge>
		))}
	</Demo>
);

export const BADGE_PROP_ROWS = propRows<OwnProps<ComponentProps<typeof Badge>, ComponentProps<"span">>>({
	variant: {
		type: VARIANTS.map((variant) => `"${variant}"`).join(" | "),
		defaultValue: '"default"',
		description: "Fill and text colour. outline sits on the panel surface with the foreground colour.",
	},
});
