import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";

export const TooltipProvider = ({ delayDuration = 0, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) => (
	<TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
);
