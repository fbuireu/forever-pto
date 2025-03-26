import { badgeVariants } from '@modules/components/core/badge/config';
import { mergeClasses } from '@ui/utils/mergeClasses';
import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
    <div className={mergeClasses(badgeVariants({ variant }), className)} {...props} />
);
