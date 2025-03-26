import * as TabsPrimitive from "@radix-ui/react-tabs";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const TabsList = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) => (
	<TabsPrimitive.List
		data-slot="tabs-list"
		className={mergeClasses(
			"bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1",
			className,
		)}
		{...props}
	/>
);
