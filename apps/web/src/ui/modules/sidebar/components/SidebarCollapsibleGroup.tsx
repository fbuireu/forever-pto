"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui/modules/core/animate/base/Collapsible";
import { SidebarMenuButton, useSidebar } from "@ui/modules/core/animate/base/Sidebar";
import { ChevronDown } from "@ui/modules/core/animate/icons/ChevronDown";
import { type ReactNode, useState } from "react";

interface SidebarCollapsibleGroupProps {
	defaultOpen?: boolean;
	icon: ReactNode;
	label: string;
	tooltip: string;
	children: ReactNode;
	"data-tutorial"?: string;
}

export function SidebarCollapsibleGroup({
	defaultOpen = false,
	icon,
	label,
	tooltip,
	children,
	"data-tutorial": dataTutorial,
}: SidebarCollapsibleGroupProps) {
	const { state } = useSidebar();
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Collapsible
			open={state === "collapsed" ? false : open}
			onOpenChange={setOpen}
			className="group/collapsible"
			data-tutorial={dataTutorial}
		>
			<CollapsibleTrigger asChild className="cursor-pointer w-full">
				<SidebarMenuButton variant="outline" tooltip={tooltip}>
					{icon}
					<span className="group-data-[collapsible=icon]:hidden">{label}</span>
					<ChevronDown className="ml-auto -rotate-90 transition-transform group-data-[open]/collapsible:rotate-0 group-data-[collapsible=icon]:hidden" />
				</SidebarMenuButton>
			</CollapsibleTrigger>
			<CollapsibleContent>{children}</CollapsibleContent>
		</Collapsible>
	);
}
