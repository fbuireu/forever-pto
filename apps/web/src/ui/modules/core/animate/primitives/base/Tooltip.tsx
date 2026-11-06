"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useControlledState } from "@ui/hooks/useControlledState";
import { getStrictContext } from "@ui/utils/context";
import { AnimatePresence, type HTMLMotionProps, m } from "motion/react";
import { type ComponentProps, createContext, isValidElement, type ReactNode, use, useMemo } from "react";

interface TooltipContextType {
	isOpen: boolean;
}
const [LocalTooltipProvider, useTooltip] = getStrictContext<TooltipContextType>("TooltipContext");

const TooltipDelayContext = createContext(0);

interface TooltipProviderProps {
	delay: number;
	children?: ReactNode;
}
function TooltipProvider({ delay, children }: TooltipProviderProps) {
	return <TooltipDelayContext value={delay}>{children}</TooltipDelayContext>;
}

type TooltipProps = ComponentProps<typeof PopoverPrimitive.Root>;
function Tooltip(props: TooltipProps) {
	const [isOpen, setIsOpen] = useControlledState({
		value: props?.open,
		defaultValue: props?.defaultOpen ?? false,
		onChange: props?.onOpenChange,
	});
	const tooltipContextValue = useMemo(() => ({ isOpen }), [isOpen]);
	return (
		<LocalTooltipProvider value={tooltipContextValue}>
			<PopoverPrimitive.Root data-slot="tooltip" {...props} open={isOpen} onOpenChange={setIsOpen} />
		</LocalTooltipProvider>
	);
}

interface TooltipTriggerProps extends ComponentProps<typeof PopoverPrimitive.Trigger> {
	asChild?: boolean;
}
function TooltipTrigger({ asChild, children, ...props }: TooltipTriggerProps) {
	const delay = use(TooltipDelayContext);
	if (asChild && isValidElement(children)) {
		return (
			<PopoverPrimitive.Trigger data-slot="tooltip-trigger" openOnHover delay={delay} render={children} {...props} />
		);
	}
	return (
		<PopoverPrimitive.Trigger data-slot="tooltip-trigger" openOnHover delay={delay} {...props}>
			{children}
		</PopoverPrimitive.Trigger>
	);
}

type TooltipPortalProps = Omit<ComponentProps<typeof PopoverPrimitive.Portal>, "keepMounted">;
function TooltipPortal(props: TooltipPortalProps) {
	const { isOpen } = useTooltip();
	return (
		<AnimatePresence>
			{isOpen && <PopoverPrimitive.Portal keepMounted data-slot="tooltip-portal" {...props} />}
		</AnimatePresence>
	);
}

type TooltipPositionerProps = ComponentProps<typeof PopoverPrimitive.Positioner>;
function TooltipPositioner(props: TooltipPositionerProps) {
	return <PopoverPrimitive.Positioner data-slot="tooltip-positioner" {...props} />;
}

interface TooltipPopupProps
	extends Omit<ComponentProps<typeof PopoverPrimitive.Popup>, "render" | keyof HTMLMotionProps<"div">>,
		HTMLMotionProps<"div"> {
	children?: ReactNode;
}
function TooltipPopup(props: TooltipPopupProps) {
	return (
		<PopoverPrimitive.Popup
			render={
				<m.div
					key="tooltip-popup"
					data-slot="tooltip-popup"
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.5 }}
					transition={{ type: "spring", stiffness: 300, damping: 25 }}
					{...props}
				/>
			}
		/>
	);
}

type TooltipArrowProps = ComponentProps<typeof PopoverPrimitive.Arrow>;
function TooltipArrow(props: TooltipArrowProps) {
	return <PopoverPrimitive.Arrow data-slot="tooltip-arrow" {...props} />;
}

export {
	Tooltip,
	TooltipArrow,
	TooltipPopup,
	type TooltipPopupProps,
	TooltipPortal,
	TooltipPositioner,
	type TooltipPositionerProps,
	type TooltipProps,
	TooltipProvider,
	type TooltipProviderProps,
	TooltipTrigger,
	type TooltipTriggerProps,
};
