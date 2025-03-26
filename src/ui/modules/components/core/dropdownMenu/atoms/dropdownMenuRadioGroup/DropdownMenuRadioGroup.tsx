import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

export const DropdownMenuRadioGroup = ({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) => (
	<DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
);
