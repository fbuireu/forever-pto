import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { mergeClasses } from "@ui/utils/mergeClasses";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const AccordionItem = forwardRef<
	ComponentRef<typeof AccordionPrimitive.Item>,
	ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
	<AccordionPrimitive.Item ref={ref} className={mergeClasses("border-b", className)} {...props} />
));
