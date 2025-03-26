import * as SheetPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";

export const SheetClose = ({ ...props }: ComponentProps<typeof SheetPrimitive.Close>) => (
	<SheetPrimitive.Close data-slot="sheet-close" {...props} />
);
