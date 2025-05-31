"use client";

import { SidebarMenuButton } from "@modules/components/core/sidebar/atoms/sidebarMenuButton/SidebarMenuButton";
import { useSidebar } from "@modules/components/core/sidebar/hooks/useSidebar/useSidebar";
import { ChevronRight, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ComponentPropsWithoutRef, type MouseEvent, forwardRef, useCallback } from "react";

export const GearSettings = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof SidebarMenuButton>>(
	(props, ref) => {
		const { toggleSidebar, state } = useSidebar();
		const t = useTranslations("filters");

		const handleClick = useCallback(
			(e: MouseEvent<HTMLButtonElement>) => {
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
			>
				<Settings className="h-5 w-5 shrink-0 data-[collapsed=true]:mr-0 data-[collapsed=false]:mr-2" />
				<span className="data-[collapsed=true]:hidden">{t("title")}</span>
				<ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 data-[collapsed=true]:hidden" />
			</SidebarMenuButton>
		);
	},
);
