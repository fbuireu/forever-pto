import * as SheetPrimitive from "@radix-ui/react-dialog";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const SheetTitle = ({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) => (
	<SheetPrimitive.Title
		data-slot="sheet-title"
		className={mergeClasses("text-foreground font-semibold", className)}
		{...props}
	/>
);
