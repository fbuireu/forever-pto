"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useControlledState } from "@ui/hooks/useControlledState";
import { getStrictContext } from "@ui/utils/context";
import { AnimatePresence, type HTMLMotionProps, m } from "motion/react";
import { type ComponentProps, isValidElement, type ReactNode, useMemo } from "react";

interface PopoverContextType {
	isOpen: boolean;
	setIsOpen: PopoverProps["onOpenChange"];
}
const [PopoverProvider, usePopover] = getStrictContext<PopoverContextType>("PopoverContext");

type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>;
function Popover(props: PopoverProps) {
	const [isOpen, setIsOpen] = useControlledState({
		value: props?.open,
		defaultValue: props?.defaultOpen,
		onChange: props?.onOpenChange,
	});
	const popoverContextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen]);
	return (
		<PopoverProvider value={popoverContextValue}>
			<PopoverPrimitive.Root data-slot="popover" {...props} onOpenChange={setIsOpen} />
		</PopoverProvider>
	);
}

interface PopoverTriggerProps extends ComponentProps<typeof PopoverPrimitive.Trigger> {
	asChild?: boolean;
}
function PopoverTrigger({ asChild, children, ...props }: PopoverTriggerProps) {
	if (asChild && isValidElement(children)) {
		return <PopoverPrimitive.Trigger data-slot="popover-trigger" render={children} {...props} />;
	}
	return (
		<PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}>
			{children}
		</PopoverPrimitive.Trigger>
	);
}

type PopoverPortalProps = Omit<ComponentProps<typeof PopoverPrimitive.Portal>, "keepMounted">;
function PopoverPortal(props: PopoverPortalProps) {
	const { isOpen } = usePopover();
	return (
		<AnimatePresence>
			{isOpen && <PopoverPrimitive.Portal keepMounted data-slot="popover-portal" {...props} />}
		</AnimatePresence>
	);
}

type PopoverPositionerProps = ComponentProps<typeof PopoverPrimitive.Positioner>;
function PopoverPositioner(props: PopoverPositionerProps) {
	return <PopoverPrimitive.Positioner data-slot="popover-positioner" {...props} />;
}

interface PopoverPopupProps
	extends Omit<
			ComponentProps<typeof PopoverPrimitive.Popup>,
			"render" | "initialFocus" | "finalFocus" | keyof HTMLMotionProps<"div">
		>,
		HTMLMotionProps<"div"> {
	children?: ReactNode;
}
function PopoverPopup(props: PopoverPopupProps) {
	return (
		<PopoverPrimitive.Popup
			render={
				<m.div
					key="popover-popup"
					data-slot="popover-popup"
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

export {
	Popover,
	PopoverPopup,
	type PopoverPopupProps,
	PopoverPortal,
	PopoverPositioner,
	type PopoverPositionerProps,
	type PopoverProps,
	PopoverTrigger,
	type PopoverTriggerProps,
};
