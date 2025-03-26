'use client';

import { labelVariants } from '@modules/components/core/label/config';
import * as LabelPrimitive from '@radix-ui/react-label';
import { mergeClasses } from '@ui/utils/mergeClasses';
import type { VariantProps } from 'class-variance-authority';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

export const Label = forwardRef<
    ComponentRef<typeof LabelPrimitive.Root>,
    ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={mergeClasses(labelVariants(), className)} {...props} />
));

Label.displayName = LabelPrimitive.Root.displayName;
