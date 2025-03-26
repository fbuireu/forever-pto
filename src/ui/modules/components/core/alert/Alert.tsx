import { alertVariants } from "@modules/components/core/alert/config";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { VariantProps } from "class-variance-authority";
import { type HTMLAttributes, forwardRef } from "react";

export const Alert = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
	({ className, variant, ...props }, ref) => (
		<div ref={ref} role="alert" className={mergeClasses(alertVariants({ variant }), className)} {...props} />
	),
);
