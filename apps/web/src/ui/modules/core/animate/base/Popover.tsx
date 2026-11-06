import { cn } from "@ui/utils/cn";
import {
	PopoverPopup as PopoverPopupPrimitive,
	type PopoverPopupProps as PopoverPopupPrimitiveProps,
	PopoverPortal as PopoverPortalPrimitive,
	PopoverPositioner as PopoverPositionerPrimitive,
	type PopoverPositionerProps as PopoverPositionerPrimitiveProps,
	Popover as PopoverPrimitive,
	type PopoverProps as PopoverPrimitiveProps,
	PopoverTrigger as PopoverTriggerPrimitive,
	type PopoverTriggerProps as PopoverTriggerPrimitiveProps,
} from "../primitives/base/Popover";

type PopoverProps = PopoverPrimitiveProps;
function Popover(props: PopoverProps) {
	return <PopoverPrimitive {...props} />;
}

type PopoverTriggerProps = PopoverTriggerPrimitiveProps;
function PopoverTrigger(props: PopoverTriggerProps) {
	return <PopoverTriggerPrimitive {...props} />;
}

interface PopoverContentProps
	extends Omit<PopoverPositionerPrimitiveProps, "className" | "style" | "children">,
		Pick<PopoverPopupPrimitiveProps, "className" | "children"> {}
function PopoverContent({ className, children, ...props }: PopoverContentProps) {
	return (
		<PopoverPortalPrimitive>
			<PopoverPositionerPrimitive align="center" sideOffset={4} className="z-210" {...props}>
				<PopoverPopupPrimitive
					className={cn(
						"bg-popover text-popover-foreground w-72 rounded-[12px] border-[3px] border-(--frame) p-4 shadow-(--shadow-brutal-md) outline-hidden origin-(--transform-origin)",
						className,
					)}
				>
					{children}
				</PopoverPopupPrimitive>
			</PopoverPositionerPrimitive>
		</PopoverPortalPrimitive>
	);
}

export { Popover, PopoverContent, PopoverTrigger };
