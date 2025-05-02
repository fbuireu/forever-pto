import * as TabsPrimitive from "@radix-ui/react-tabs";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const TabsContent = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) => (
	<TabsPrimitive.Content
		data-slot="tabs-content"
		className={mergeClasses("flex-1 outline-none", className)}
		{...props}
	/>
);
