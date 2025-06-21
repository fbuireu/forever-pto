"use client";

import logo from "@assets/images/png/logo.png";
import { useSidebar } from "@modules/components/core/sidebar/hooks/useSidebar/useSidebar";
import Image from "next/image";

export const SidebarLogo = () => {
	const { state } = useSidebar();
	return (
		<div className="flex aspect-square size-8 items-center justify-center gap-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground w-full">
			<Image src={logo} width={75} alt="Forever PTO" />
			{state !== "collapsed" && <p className="mt-2">Forever PTO</p>}
		</div>
	);
};
