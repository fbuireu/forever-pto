"use client";

import { useIsMobile } from "@ui/hooks/useMobile";
import { cn } from "@ui/utils/cn";
import { setCookie } from "@ui/utils/cookie";
import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME } from "@ui/utils/sidebarCookie";
import { AnimatePresence, m, type Transition } from "motion/react";
import {
	type ComponentProps,
	createContext,
	type MouseEvent,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "../../primitives/Button";
import { MotionHighlight, MotionHighlightItem } from "../effects/MotionHighlight";
import { PanelLeftIcon } from "../icons/PanelLeft";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";

const SIDEBAR_WIDTH = "20rem";
const SIDEBAR_WIDTH_MOBILE = "20rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const HIGHLIGHT_TRANSITION: Transition = { type: "spring", stiffness: 350, damping: 35 };

interface SidebarContextProps {
	state: "expanded" | "collapsed";
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextProps | null>(null);

function useSidebar(): SidebarContextProps {
	const context = use(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider.");
	}

	return context;
}

interface SidebarProviderProps {
	children: ReactNode;
}

function SidebarProvider({ children }: SidebarProviderProps) {
	const isMobile = useIsMobile();
	const [openMobile, setOpenMobile] = useState(false);
	const [open, setInternalOpen] = useState(true);
	const setOpen = useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === "function" ? value(open) : value;
			setInternalOpen(openState);
			setCookie({ name: SIDEBAR_COOKIE_NAME, value: String(openState), maxAge: SIDEBAR_COOKIE_MAX_AGE }).catch(
				() => {},
			);
		},
		[open],
	);

	const toggleSidebar = useCallback(() => {
		return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
	}, [isMobile, setOpen]);

	useEffect(() => {
		const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)`));
		if (match) {
			setInternalOpen(match[1] !== "false");
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				toggleSidebar();
			}
		};

		globalThis.addEventListener("keydown", handleKeyDown);
		return () => globalThis.removeEventListener("keydown", handleKeyDown);
	}, [toggleSidebar]);

	useEffect(() => {
		if (!openMobile) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpenMobile(false);
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [openMobile]);

	const state = open ? "expanded" : "collapsed";

	const contextValue = useMemo<SidebarContextProps>(
		() => ({
			state,
			open,
			setOpen,
			isMobile,
			openMobile,
			setOpenMobile,
			toggleSidebar,
		}),
		[state, open, setOpen, isMobile, openMobile, toggleSidebar],
	);

	return (
		<SidebarContext value={contextValue}>
			<TooltipProvider>
				<div
					data-slot="sidebar-wrapper"
					style={{
						"--sidebar-width": SIDEBAR_WIDTH,
						"--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
					}}
					className="group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full"
				>
					{children}
				</div>
			</TooltipProvider>
		</SidebarContext>
	);
}

interface SidebarProps {
	landmarkLabel: string;
	children: ReactNode;
}

function Sidebar({ children, landmarkLabel }: SidebarProps) {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
	const drawerRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!isMobile) return;

		if (!openMobile) {
			returnFocusRef.current?.focus();
			returnFocusRef.current = null;
			return;
		}

		returnFocusRef.current = document.activeElement as HTMLElement | null;
		drawerRef.current?.focus();

		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpenMobile(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [isMobile, openMobile, setOpenMobile]);

	if (isMobile) {
		return (
			<AnimatePresence>
				{openMobile && (
					<>
						<m.div
							key="sidebar-backdrop"
							className="fixed inset-0 z-51 bg-shade/80"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							onClick={() => setOpenMobile(false)}
							aria-hidden="true"
						/>
						<m.div
							key="sidebar-drawer"
							ref={drawerRef}
							tabIndex={-1}
							role="dialog"
							aria-modal="false"
							aria-label={landmarkLabel}
							data-sidebar="sidebar"
							data-slot="sidebar"
							data-mobile="true"
							className="bg-sidebar text-sidebar-foreground fixed inset-y-0 z-51 flex h-full flex-col border-[3px] border-(--frame) shadow-(--shadow-brutal-xl) outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset left-0 rounded-r-[14px]"
							style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE, width: "var(--sidebar-width)" }}
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "spring", stiffness: 350, damping: 35 }}
						>
							<MotionHighlight hover mode="parent" containerClassName="h-full" transition={HIGHLIGHT_TRANSITION}>
								<div className="flex h-full w-full flex-col">{children}</div>
							</MotionHighlight>
						</m.div>
					</>
				)}
			</AnimatePresence>
		);
	}

	return (
		<div
			className="group peer text-sidebar-foreground hidden md:block"
			data-state={state}
			data-collapsible={state === "collapsed" ? "icon" : ""}
			data-variant="inset"
			data-side="left"
			data-slot="sidebar"
		>
			<div
				data-slot="sidebar-gap"
				className="relative w-(--sidebar-width) bg-transparent transition-[width] duration-400 ease-[cubic-bezier(0.7,-0.15,0.25,1.15)] group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
			/>
			<aside
				data-slot="sidebar-container"
				aria-label={landmarkLabel}
				className="fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-400 ease-[cubic-bezier(0.75,0,0.25,1)] md:flex left-0 p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
			>
				<MotionHighlight hover mode="parent" containerClassName="w-full h-full" transition={HIGHLIGHT_TRANSITION}>
					<div
						data-slot="sidebar-content"
						className="bg-sidebar flex h-full w-full flex-col rounded-[14px] border-[3px] border-(--frame) shadow-(--shadow-brutal-lg)"
					>
						{children}
					</div>
				</MotionHighlight>
			</aside>
		</div>
	);
}

interface SidebarTriggerProps {
	className: string;
	label: string;
}

function SidebarTrigger({ className, label }: SidebarTriggerProps) {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			data-slot="sidebar-trigger"
			data-sidebar="trigger"
			variant="ghost"
			size="icon"
			className={cn(
				"relative z-50 size-11 rounded-xl bg-accent text-accent-foreground border-[3px] border-(--color-brand-ink) shadow-(--shadow-brutal-xs) transition-[transform,box-shadow] hover:bg-accent hover:text-accent-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-(--shadow-brutal-sm) active:bg-accent active:text-accent-foreground active:translate-x-0.5 active:translate-y-0.5 active:shadow-(--shadow-brutal-btn-active) cursor-pointer",
				className,
			)}
			onClick={toggleSidebar}
		>
			<PanelLeftIcon className="size-full" />
			<span className="sr-only">{label}</span>
		</Button>
	);
}

type SidebarInsetProps = ComponentProps<"main">;

function SidebarInset({ className, ...props }: SidebarInsetProps) {
	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				"bg-background relative flex min-h-svh flex-1 flex-col",
				"peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))] md:peer-data-[variant=inset]:m-2.25 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-3 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-[14px] md:peer-data-[variant=inset]:border-[3px] md:peer-data-[variant=inset]:border-(--frame) md:peer-data-[variant=inset]:shadow-(--shadow-brutal-lg)",
				className,
			)}
			{...props}
		/>
	);
}

type SidebarHeaderProps = ComponentProps<"div">;

function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn("flex flex-col gap-3 p-3", className)}
			{...props}
		/>
	);
}

type SidebarFooterProps = ComponentProps<"div">;

function SidebarFooter({ className, ...props }: SidebarFooterProps) {
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn("flex flex-col gap-3 p-3", className)}
			{...props}
		/>
	);
}

type SidebarContentProps = ComponentProps<"div">;

function SidebarContent({ className, ...props }: SidebarContentProps) {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				"flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-1 pb-2 group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-2",
				className,
			)}
			{...props}
		/>
	);
}

type SidebarGroupProps = ComponentProps<"div">;

function SidebarGroup({ className, ...props }: SidebarGroupProps) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn("relative flex w-full min-w-0 flex-col rounded-xl bg-(--surface-panel-inset) p-2.5", className)}
			{...props}
		/>
	);
}

type SidebarGroupLabelProps = ComponentProps<"div">;

function SidebarGroupLabel({ className, ...props }: SidebarGroupLabelProps) {
	return (
		<div
			data-slot="sidebar-group-label"
			data-sidebar="group-label"
			className={cn(
				"text-sidebar-foreground/75 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-[8px] px-2 text-[0.68rem] font-mono font-bold uppercase tracking-widest outline-hidden transition-[margin,opa] duration-200 ease-linear focus-visible:ring-[3px] [&>svg]:size-4 [&>svg]:shrink-0",
				"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
				className,
			)}
			{...props}
		/>
	);
}

type SidebarMenuProps = ComponentProps<"ul">;

function SidebarMenu({ className, ...props }: SidebarMenuProps) {
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn("flex w-full min-w-0 flex-col gap-2", className)}
			{...props}
		/>
	);
}

type SidebarMenuItemProps = ComponentProps<"li">;

function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn("group/menu-item relative", className)}
			{...props}
		/>
	);
}

const SIDEBAR_MENU_BUTTON_CLASSES =
	"relative hit-area-stable peer/menu-button flex w-full items-center gap-2 rounded-[8px] border-[3px] border-[var(--frame)] p-2.5 text-left text-sm font-medium outline-hidden ring-sidebar-ring transition-[width,height,padding,transform,box-shadow] shadow-[var(--shadow-brutal-xs)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[var(--shadow-brutal-sm)] focus-visible:ring-[3px] active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 bg-[var(--surface-panel)] shadow-[var(--shadow-brutal-xs)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[var(--shadow-brutal-sm)] h-8 text-sm";

const SIDEBAR_MENU_BUTTON_ACTIVE_CLASSES =
	"bg-sidebar-accent text-sidebar-accent-foreground border-[var(--frame)] shadow-[var(--shadow-brutal-xs)]";

interface SidebarMenuButtonProps extends ComponentProps<"button"> {
	tooltip: string;
}

function SidebarMenuButton({ tooltip, className, ...props }: SidebarMenuButtonProps) {
	const { isMobile, state, setOpen } = useSidebar();

	const expandAndForward = (e: MouseEvent<HTMLButtonElement>) => {
		if (state === "collapsed" && !isMobile) setOpen(true);
		props.onClick?.(e);
	};

	const button = (
		<MotionHighlightItem activeClassName={SIDEBAR_MENU_BUTTON_ACTIVE_CLASSES}>
			<button
				data-slot="sidebar-menu-button"
				data-sidebar="menu-button"
				data-size="default"
				data-active={false}
				className={cn(SIDEBAR_MENU_BUTTON_CLASSES, className)}
				{...props}
				onClick={expandAndForward}
			/>
		</MotionHighlightItem>
	);

	if (isMobile || state !== "collapsed") {
		return button;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild nativeButton={false} tabIndex={-1} role="none">
				{button}
			</TooltipTrigger>
			<TooltipContent side="right" align="center">
				{tooltip}
			</TooltipContent>
		</Tooltip>
	);
}

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
};
