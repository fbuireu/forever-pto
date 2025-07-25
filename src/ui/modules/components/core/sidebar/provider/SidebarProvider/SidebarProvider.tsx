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
	const [isOpen, setIsOpen] = useState(defaultOpen);

	const open = openProp ?? isOpen;

	useEffect(() => {
		const loadCookieState = async () => {
			if (openProp === undefined) {
				const cookie = await cookieStore.get(String(DEFAULT_SIDEBAR_CONFIG.SIDEBAR_COOKIE_NAME));

				if (cookie?.value !== undefined) {
					const cookieState = cookie.value === "true";
					if (cookieState !== isOpen) {
						setIsOpen(cookieState);
					}
				}
			}
		};

		loadCookieState();
	}, [openProp, isOpen]);

	const setOpen = useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === "function" ? value(open) : value;
			const openFn = setOpenProp || setIsOpen;

			openFn(openState);

			cookieStore.set({
				name: String(DEFAULT_SIDEBAR_CONFIG.SIDEBAR_COOKIE_NAME),
				value: String(openState),
				path: "/",
				maxAge: DEFAULT_SIDEBAR_CONFIG.SIDEBAR_COOKIE_MAX_AGE as number,
			});
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
