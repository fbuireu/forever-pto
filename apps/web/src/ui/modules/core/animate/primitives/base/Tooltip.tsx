'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { useControlledState } from '@ui/hooks/useControlledState';
import { getStrictContext } from '@ui/utils/context';
import {
  AnimatePresence,
  type HTMLMotionProps,
  type MotionValue,
  m,
  type SpringOptions,
  useMotionValue,
  useSpring,
} from 'motion/react';
import { type ComponentProps, createContext, isValidElement, type ReactNode, use, useMemo } from 'react';

type TooltipContextType = {
  isOpen: boolean;
  x: MotionValue<number>;
  y: MotionValue<number>;
  followCursor?: boolean | 'x' | 'y';
  followCursorSpringOptions?: SpringOptions;
};
const [LocalTooltipProvider, useTooltip] = getStrictContext<TooltipContextType>('TooltipContext');

const TooltipDelayContext = createContext(0);

type TooltipProviderProps = { delay?: number; children?: ReactNode };
function TooltipProvider({ delay = 0, children }: TooltipProviderProps) {
  return <TooltipDelayContext.Provider value={delay}>{children}</TooltipDelayContext.Provider>;
}

type TooltipProps = ComponentProps<typeof PopoverPrimitive.Root> & {
  followCursor?: boolean | 'x' | 'y';
  followCursorSpringOptions?: SpringOptions;
};
function Tooltip({
  followCursor = false,
  followCursorSpringOptions = { stiffness: 200, damping: 17 },
  ...props
}: TooltipProps) {
  const [isOpen, setIsOpen] = useControlledState({
    value: props?.open,
    defaultValue: props?.defaultOpen ?? false,
    onChange: props?.onOpenChange,
  });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tooltipContextValue = useMemo(
    () => ({ isOpen, x, y, followCursor, followCursorSpringOptions }),
    [isOpen, x, y, followCursor, followCursorSpringOptions]
  );
  return (
    <LocalTooltipProvider value={tooltipContextValue}>
      <PopoverPrimitive.Root data-slot='tooltip' {...props} open={isOpen} onOpenChange={setIsOpen} />
    </LocalTooltipProvider>
  );
}

type TooltipTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger> & { asChild?: boolean };
function TooltipTrigger({ onMouseMove, asChild, children, openOnHover = true, delay, ...props }: TooltipTriggerProps) {
  const providerDelay = use(TooltipDelayContext);
  const { x, y, followCursor } = useTooltip();
  const handleMouseMove = (event: Parameters<NonNullable<TooltipTriggerProps['onMouseMove']>>[0]) => {
    onMouseMove?.(event);
    const target = event.currentTarget.getBoundingClientRect();
    if (followCursor === 'x' || followCursor === true) x.set((event.clientX - target.left - target.width / 2) / 2);
    if (followCursor === 'y' || followCursor === true) y.set((event.clientY - target.top - target.height / 2) / 2);
  };
  if (asChild && isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger
        data-slot='tooltip-trigger'
        openOnHover={openOnHover}
        delay={delay ?? providerDelay}
        onMouseMove={handleMouseMove}
        render={children}
        {...props}
      />
    );
  }
  return (
    <PopoverPrimitive.Trigger
      data-slot='tooltip-trigger'
      openOnHover={openOnHover}
      delay={delay ?? providerDelay}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </PopoverPrimitive.Trigger>
  );
}

type TooltipPortalProps = Omit<ComponentProps<typeof PopoverPrimitive.Portal>, 'keepMounted'>;
function TooltipPortal(props: TooltipPortalProps) {
  const { isOpen } = useTooltip();
  return (
    <AnimatePresence>
      {isOpen && <PopoverPrimitive.Portal keepMounted data-slot='tooltip-portal' {...props} />}
    </AnimatePresence>
  );
}

type TooltipPositionerProps = ComponentProps<typeof PopoverPrimitive.Positioner>;
function TooltipPositioner(props: TooltipPositionerProps) {
  return <PopoverPrimitive.Positioner data-slot='tooltip-positioner' {...props} />;
}

type TooltipPopupProps = Omit<ComponentProps<typeof PopoverPrimitive.Popup>, 'render'> & HTMLMotionProps<'div'>;
function TooltipPopup({
  transition = { type: 'spring', stiffness: 300, damping: 25 },
  style,
  ...props
}: TooltipPopupProps) {
  const { x, y, followCursor, followCursorSpringOptions } = useTooltip();
  const translateX = useSpring(x, followCursorSpringOptions);
  const translateY = useSpring(y, followCursorSpringOptions);
  return (
    <PopoverPrimitive.Popup
      render={
        <m.div
          key='tooltip-popup'
          data-slot='tooltip-popup'
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={transition}
          style={{
            x: followCursor === 'x' || followCursor === true ? translateX : undefined,
            y: followCursor === 'y' || followCursor === true ? translateY : undefined,
            ...style,
          }}
          {...props}
        />
      }
    />
  );
}

type TooltipArrowProps = ComponentProps<typeof PopoverPrimitive.Arrow>;
function TooltipArrow(props: TooltipArrowProps) {
  return <PopoverPrimitive.Arrow data-slot='tooltip-arrow' {...props} />;
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
