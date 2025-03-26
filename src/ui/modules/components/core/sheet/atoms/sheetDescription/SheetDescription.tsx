import * as SheetPrimitive from "@radix-ui/react-dialog";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const SheetDescription = ({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>) => (
	<SheetPrimitive.Description
		data-slot="sheet-description"
		className={mergeClasses("text-muted-foreground text-sm", className)}
		{...props}
	/>
);
