import { cn } from '@ui/utils/cn';
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
} from '../primitives/base/Popover';

type PopoverProps = PopoverPrimitiveProps;
function Popover(props: PopoverProps) {
  return <PopoverPrimitive {...props} />;
}

type PopoverTriggerProps = PopoverTriggerPrimitiveProps;
function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverTriggerPrimitive {...props} />;
}

type PopoverContentProps = PopoverPositionerPrimitiveProps &
  PopoverPopupPrimitiveProps & { positionerClassName?: string };
function PopoverContent({
  className,
  positionerClassName,
  align = 'center',
  sideOffset = 4,
  initialFocus,
  finalFocus,
  style,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortalPrimitive>
      <PopoverPositionerPrimitive
        align={align}
        sideOffset={sideOffset}
        className={cn('z-52', positionerClassName)}
        {...props}
      >
        <PopoverPopupPrimitive
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          className={cn(
            'bg-popover text-popover-foreground w-72 rounded-[12px] border-[3px] border-(--frame) p-4 shadow-(--shadow-brutal-md) outline-hidden origin-(--transform-origin)',
            className
          )}
          style={style}
        >
          {children}
        </PopoverPopupPrimitive>
      </PopoverPositionerPrimitive>
    </PopoverPortalPrimitive>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
