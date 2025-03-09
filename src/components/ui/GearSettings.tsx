"use client";

import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { ChevronRight, Settings } from 'lucide-react';
import React, { useCallback } from 'react';

export const GearSettings = React.forwardRef<
	HTMLButtonElement,
	React.ComponentPropsWithoutRef<typeof SidebarMenuButton>
>((props, ref) => {
	const { toggleSidebar, state } = useSidebar();

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (state === "collapsed") {
				e.preventDefault();
				e.stopPropagation();

				toggleSidebar();
			} else if (props.onClick) {
				props.onClick(e);
			}
		},
		[state, toggleSidebar, props.onClick],
	);

	return (
		<SidebarMenuButton
			ref={ref}
			{...props}
			variant="outline"
			tooltip="Configuration"
			onClick={handleClick}
			className={props.className}
			// className={mergeClass(
			// 	props.className,
			// 	"transition-transform duration-150 hover:bg-gray-200 data-[collapsed=false]:hover:bg-gray-200",
			// )}
		>
			<Settings className="h-5 w-5 shrink-0 data-[collapsed=true]:mr-0 data-[collapsed=false]:mr-2" />
			<span className="data-[collapsed=true]:hidden">Configuration</span>
			<ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 data-[collapsed=true]:hidden" />
		</SidebarMenuButton>
	);
});

GearSettings.displayName = "GearSettings";
