import type { badgeVariants } from "@modules/components/core/badge/Badge";
import type { VariantProps } from "class-variance-authority";

export function getBadgeVariant(ratio: string): VariantProps<typeof badgeVariants>["variant"] {
	const ratioValue = Number.parseFloat(ratio);

	if (ratioValue > 1.75) return "success";
	if (ratioValue >= 1.25) return "warning";
	return "destructive";
}
