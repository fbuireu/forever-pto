"use client";

import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@ui/utils/cn";
import { AnimatePresence, type HTMLMotionProps, m } from "motion/react";
import {
	type ComponentProps,
	createContext,
	type ReactElement,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { MotionHighlight, MotionHighlightItem } from "../effects/MotionHighlight";

interface DropdownMenuContextType {
	isOpen: boolean;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

const useDropdownMenu = (): DropdownMenuContextType => {
	const context = use(DropdownMenuContext);
	if (!context) {
		throw new Error("useDropdownMenu must be used within a DropdownMenu");
	}
	return context;
};

type DropdownMenuProps = ComponentProps<typeof DropdownMenuPrimitive.Root>;

function DropdownMenu({ children, ...props }: DropdownMenuProps) {
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

	const contextValue = useMemo(() => ({ isOpen }), [isOpen]);

	return (
		<DropdownMenuContext value={contextValue}>
			<DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} onOpenChange={handleOpenChange}>
				{children}
			</DropdownMenuPrimitive.Root>
		</DropdownMenuContext>
	);
}

interface DropdownMenuTriggerProps extends Omit<ComponentProps<typeof DropdownMenuPrimitive.Trigger>, "render"> {
	children: ReactElement;
}

function DropdownMenuTrigger({ children, ...props }: DropdownMenuTriggerProps) {
	return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" render={children} {...props} />;
}

interface DropdownMenuContentProps
	extends Omit<ComponentProps<typeof DropdownMenuPrimitive.Popup>, "render" | keyof HTMLMotionProps<"div">>,
		HTMLMotionProps<"div"> {
	children?: ReactNode;
}

function DropdownMenuContent({ className, children, ...props }: DropdownMenuContentProps) {
	const { isOpen } = useDropdownMenu();

	return (
		<AnimatePresence>
			{isOpen && (
				<DropdownMenuPrimitive.Portal keepMounted data-slot="dropdown-menu-portal">
					<DropdownMenuPrimitive.Positioner sideOffset={4} align="end" positionMethod="fixed" className="z-210">
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
									transition={{ duration: 0.2 }}
									{...(props as HTMLMotionProps<"div">)}
								/>
							}
						>
							<MotionHighlight
								hover
								className="rounded-[8px]"
								transition={{ type: "spring", stiffness: 350, damping: 35 }}
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

interface DropdownMenuItemProps
	extends Omit<ComponentProps<typeof DropdownMenuPrimitive.Item>, "render" | keyof HTMLMotionProps<"div">>,
		HTMLMotionProps<"div"> {
	children?: ReactNode;
}

function DropdownMenuItem({ className, children, ...props }: DropdownMenuItemProps) {
	return (
		<MotionHighlightItem activeClassName="bg-accent">
			<DropdownMenuPrimitive.Item
				{...(props as ComponentProps<typeof DropdownMenuPrimitive.Item>)}
				render={
					<m.div
						data-slot="dropdown-menu-item"
						whileTap={{ scale: 0.97 }}
						className={cn(
							"[&:not([data-highlight])]:focus:bg-accent focus:text-accent-foreground data-[active=true]:text-accent-foreground data-[active=true]:[&_svg:not([class*='text-'])]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative z-1 flex cursor-default select-none items-center gap-2 rounded-[8px] border border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
