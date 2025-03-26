import * as SheetPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";

export const SheetPortal = ({ ...props }: ComponentProps<typeof SheetPrimitive.Portal>) => (
	<SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
);
