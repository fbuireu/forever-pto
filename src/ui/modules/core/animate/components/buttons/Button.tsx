'use client';

import { buttonVariants } from '@ui/modules/core/primitives/Button';
import { cn } from '@ui/utils/utils';
import type { VariantProps } from 'class-variance-authority';
import { Button as ButtonPrimitive, type ButtonProps as ButtonPrimitiveProps } from '../../primitives/buttons/Button';

type ButtonProps = ButtonPrimitiveProps & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return <ButtonPrimitive className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, type ButtonProps, buttonVariants };
