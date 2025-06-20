"use client";

import { DEFAULT_SIDEBAR_CONFIG } from "@modules/components/appSidebar/const";
import { SidebarContext } from "@modules/components/core/sidebar/hooks/useSidebar/useSidebar";
import type { SidebarContextProps } from "@modules/components/core/sidebar/types";
import { TooltipProvider } from "@modules/components/core/tooltip/provider/TooltipProvider";
import { useMobile } from "@ui/hooks/useMobile/useMobile";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type ComponentProps, type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";

interface SidebarProviderProps extends ComponentProps<"div"> {
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const getCookieValue = (name: string): string | null => {
	if (typeof document === "undefined") return null;

	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
	return null;
};

const getInitialOpenState = (defaultOpen: boolean): boolean => {
	const cookieValue = getCookieValue(String(DEFAULT_SIDEBAR_CONFIG.SIDEBAR_COOKIE_NAME));
	if (cookieValue !== null) {
		return cookieValue === "true";
	}
	return defaultOpen;
};

export const SidebarProvider = ({
	defaultOpen = true,
	open: openProp,
	onOpenChange: setOpenProp,
	className,
	style,
	children,
	...props
}: SidebarProviderProps) => {
	const isMobile = useMobile();
	const [openMobile, setOpenMobile] = useState(false);
	const [_open, _setOpen] = useState(() => getInitialOpenState(defaultOpen));

	const open = openProp ?? _open;

	const setOpen = useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === "function" ? value(open) : value;
			if (setOpenProp) {
				setOpenProp(openState);
			} else {
				_setOpen(openState);
			}
			document.cookie = `${DEFAULT_SIDEBAR_CONFIG.SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${DEFAULT_SIDEBAR_CONFIG.SIDEBAR_COOKIE_MAX_AGE}`;
		},
		[setOpenProp, open],
	);

	const toggleSidebar = useCallback(() => {
		return isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev);
	}, [isMobile, setOpen]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === DEFAULT_SIDEBAR_CONFIG.SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				toggleSidebar();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [toggleSidebar]);

	const contextValue = useMemo<SidebarContextProps>(
		() => ({
			state: open ? "expanded" : "collapsed",
			open,
			setOpen,
			isMobile,
			openMobile,
			setOpenMobile,
			toggleSidebar,
		}),
		[open, setOpen, isMobile, openMobile, toggleSidebar],
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			<TooltipProvider delayDuration={0}>
				<div
					data-slot="sidebar-wrapper"
					style={
						{
							"--sidebar-width": DEFAULT_SIDEBAR_CONFIG.SIDEBAR_WIDTH,
							"--sidebar-width-icon": DEFAULT_SIDEBAR_CONFIG.SIDEBAR_WIDTH_ICON,
							...style,
						} as CSSProperties
					}
					className={mergeClasses(
						"group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
						className,
					)}
					{...props}
				>
					{children}
				</div>
			</TooltipProvider>
		</SidebarContext.Provider>
	);
};
