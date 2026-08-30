"use client";

import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@ui/utils/cn";
import { AnimatePresence, type HTMLMotionProps, m, type Transition } from "motion/react";
import {
	type ComponentProps,
	createContext,
	isValidElement,
	type ReactElement,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { MotionHighlight, MotionHighlightItem } from "../effects/MotionHighlight";

type DropdownMenuContextType = {
	isOpen: boolean;
	highlightTransition: Transition;
	animateOnHover: boolean;
};

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

const useDropdownMenu = () => {
	const context = use(DropdownMenuContext);
	if (!context) {
		throw new Error("useDropdownMenu must be used within a DropdownMenu");
	}
	return context;
};

type DropdownMenuProps = ComponentProps<typeof DropdownMenuPrimitive.Root> & {
	transition?: Transition;
	animateOnHover?: boolean;
};

function DropdownMenu({
	children,
	transition = { type: "spring", stiffness: 350, damping: 35 },
	animateOnHover = true,
	...props
}: DropdownMenuProps) {
	const [isOpen, setIsOpen] = useState(props?.open ?? props?.defaultOpen ?? false);

	useEffect(() => {
		if (props?.open !== undefined) setIsOpen(props.open);
	}, [props?.open]);

	const handleOpenChange = useCallback(
		(...args: Parameters<NonNullable<DropdownMenuProps["onOpenChange"]>>) => {
			setIsOpen(args[0]);
			props.onOpenChange?.(...args);
		},
		[props.onOpenChange],
	);

	const contextValue = useMemo(
		() => ({ isOpen, highlightTransition: transition, animateOnHover }),
		[isOpen, transition, animateOnHover],
	);

	return (
		<DropdownMenuContext.Provider value={contextValue}>
			<DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} onOpenChange={handleOpenChange}>
				{children}
			</DropdownMenuPrimitive.Root>
		</DropdownMenuContext.Provider>
	);
}

type DropdownMenuTriggerProps = ComponentProps<typeof DropdownMenuPrimitive.Trigger> & { asChild?: boolean };

function DropdownMenuTrigger({ asChild, children, ...props }: DropdownMenuTriggerProps) {
	if (asChild && isValidElement(children)) {
		return (
			<DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" render={children as ReactElement} {...props} />
		);
	}
	return (
		<DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props}>
			{children}
		</DropdownMenuPrimitive.Trigger>
	);
}

type DropdownMenuContentProps = Omit<ComponentProps<typeof DropdownMenuPrimitive.Popup>, "render"> &
	HTMLMotionProps<"div"> & {
		transition?: Transition;
		sideOffset?: number;
		align?: "start" | "center" | "end";
	};

function DropdownMenuContent({
	className,
	children,
	sideOffset = 4,
	align = "start",
	transition = { duration: 0.2 },
	...props
}: DropdownMenuContentProps) {
	const { isOpen, highlightTransition, animateOnHover } = useDropdownMenu();

	return (
		<AnimatePresence>
			{isOpen && (
				<DropdownMenuPrimitive.Portal keepMounted data-slot="dropdown-menu-portal">
					<DropdownMenuPrimitive.Positioner
						sideOffset={sideOffset}
						align={align}
						positionMethod="fixed"
						className="z-52"
					>
						<DropdownMenuPrimitive.Popup
							render={
								<m.div
									key="dropdown-menu-content"
									data-slot="dropdown-menu-content"
									className={cn(
										"z-50 max-h-(--available-height) min-w-32 overflow-y-auto overflow-x-hidden rounded-xl border-[3px] border-(--frame) bg-popover p-1.5 text-popover-foreground shadow-(--shadow-brutal-md) origin-(--transform-origin)",
										className,
									)}
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									transition={transition}
									{...(props as HTMLMotionProps<"div">)}
								/>
							}
						>
							<MotionHighlight
								hover
								className="rounded-[8px]"
								controlledItems
								transition={highlightTransition}
								enabled={animateOnHover}
							>
								{children}
							</MotionHighlight>
						</DropdownMenuPrimitive.Popup>
					</DropdownMenuPrimitive.Positioner>
				</DropdownMenuPrimitive.Portal>
			)}
		</AnimatePresence>
	);
}

type DropdownMenuItemProps = Omit<ComponentProps<typeof DropdownMenuPrimitive.Item>, "render"> &
	HTMLMotionProps<"div"> & {
		inset?: boolean;
		variant?: "default" | "destructive";
	};

function DropdownMenuItem({
	className,
	children,
	inset,
	disabled,
	variant = "default",
	...props
}: DropdownMenuItemProps) {
	return (
		<MotionHighlightItem
			activeClassName={cn(
				variant === "default" && "bg-accent",
				variant === "destructive" && "bg-destructive/10 dark:bg-destructive/20",
			)}
			disabled={disabled}
		>
			<DropdownMenuPrimitive.Item
				{...(props as ComponentProps<typeof DropdownMenuPrimitive.Item>)}
				disabled={disabled}
				render={
					<m.div
						data-slot="dropdown-menu-item"
						data-inset={inset}
						data-variant={variant}
						data-disabled={disabled}
						whileTap={{ scale: 0.97 }}
						className={cn(
							"[&:not([data-highlight])]:focus:bg-accent focus:text-accent-foreground data-[active=true]:text-accent-foreground data-[active=true]:[&_svg:not([class*='text-'])]:text-accent-foreground data-[variant=destructive]:text-destructive [&:not([data-highlight])]:data-[variant=destructive]:focus:bg-destructive/10 dark:[&:not([data-highlight])]:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! [&_svg:not([class*='text-'])]:text-muted-foreground relative z-1 flex cursor-default select-none items-center gap-2 rounded-[8px] border border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
							inset && "pl-8",
							className,
						)}
					/>
				}
			>
				{children}
			</DropdownMenuPrimitive.Item>
		</MotionHighlightItem>
	);
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger };
