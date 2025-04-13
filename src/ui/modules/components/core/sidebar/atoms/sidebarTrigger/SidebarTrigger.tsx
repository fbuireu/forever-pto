"use client";

import { Button } from "@modules/components/core/button/Button";
import { useSidebar } from "@modules/components/core/sidebar/hooks/useSidebar/useSidebar";
import { mergeClasses } from "@ui/utils/mergeClasses";
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
			className={mergeClasses("h-10 w-10 sticky top-0", className)}
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
