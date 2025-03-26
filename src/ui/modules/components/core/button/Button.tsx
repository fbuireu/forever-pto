import { buttonVariants } from "@modules/components/core/button/config";
import { Slot } from "@radix-ui/react-slot";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return <Comp className={mergeClasses(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
	},
);
