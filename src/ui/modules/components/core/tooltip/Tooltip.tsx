"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";
import { TooltipProvider } from "./provider/TooltipProvider";

export const Tooltip = ({ ...props }: ComponentProps<typeof TooltipPrimitive.Root>) => (
	<TooltipProvider>
		<TooltipPrimitive.Root data-slot="tooltip" {...props} />
	</TooltipProvider>
);
