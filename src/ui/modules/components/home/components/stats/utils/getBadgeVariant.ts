import type { badgeVariants } from '@modules/components/core/badge/Badge';
import type { VariantProps } from 'class-variance-authority';

export function getBadgeVariant(ratio: string): NonNullable<VariantProps<typeof badgeVariants>["variant"]> {
	const ratioValue = Number.parseFloat(ratio);

	if (ratioValue > 2) return "success";
	if (ratioValue >= 1.5) return "warning";
	return "destructive";
}
