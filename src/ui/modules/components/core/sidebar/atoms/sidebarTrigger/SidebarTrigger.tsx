"use client";

import { Button } from "@modules/components/core/button/Button";
import { useSidebar } from "@modules/components/core/sidebar/hooks/useSidebar/useSidebar";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { PanelLeftIcon } from "lucide-react";
import type { ComponentProps } from "react";

export const SidebarTrigger = ({ className, onClick, ...props }: ComponentProps<typeof Button>) => {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon"
			className={mergeClasses(
				"h-10 w-10 top-2.5 fixed ml-2 lg:static lg:ml-0 bg-background [&_svg]:h-6 [&_svg]:w-6 md:[&_svg]:h-4 md:[&_svg]:w-4 z-50",
				className,
			)}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<PanelLeftIcon />
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	);
};
