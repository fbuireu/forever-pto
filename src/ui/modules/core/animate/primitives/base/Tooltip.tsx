'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
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
import * as React from 'react';
import { useControlledState } from 'src/ui/hooks/useControlledState';

type TooltipContextType = {
  isOpen: boolean;
  setIsOpen: TooltipProps['onOpenChange'];
  x: MotionValue<number>;
  y: MotionValue<number>;
  followCursor?: boolean | 'x' | 'y';
  followCursorSpringOptions?: SpringOptions;
};
const [LocalTooltipProvider, useTooltip] = getStrictContext<TooltipContextType>('TooltipContext');

type TooltipProviderProps = React.ComponentProps<typeof TooltipPrimitive.Provider>;
function TooltipProvider(props: TooltipProviderProps) {
  return <TooltipPrimitive.Provider data-slot='tooltip-provider' {...props} />;
}

type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root> & {
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
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
  });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tooltipContextValue = React.useMemo(
    () => ({ isOpen, setIsOpen, x, y, followCursor, followCursorSpringOptions }),
    [isOpen, setIsOpen, x, y, followCursor, followCursorSpringOptions]
  );
  return (
    <LocalTooltipProvider value={tooltipContextValue}>
      <TooltipPrimitive.Root data-slot='tooltip' {...props} onOpenChange={setIsOpen} />
    </LocalTooltipProvider>
  );
}

type TooltipTriggerProps = React.ComponentProps<typeof TooltipPrimitive.Trigger> & { asChild?: boolean };
function TooltipTrigger({ onMouseMove, asChild, children, ...props }: TooltipTriggerProps) {
  const { x, y, followCursor } = useTooltip();
  const handleMouseMove = (event: Parameters<NonNullable<TooltipTriggerProps['onMouseMove']>>[0]) => {
    onMouseMove?.(event);
    const target = event.currentTarget.getBoundingClientRect();
    if (followCursor === 'x' || followCursor === true) x.set((event.clientX - target.left - target.width / 2) / 2);
    if (followCursor === 'y' || followCursor === true) y.set((event.clientY - target.top - target.height / 2) / 2);
  };
  if (asChild && React.isValidElement(children)) {
    return (
      <TooltipPrimitive.Trigger
        data-slot='tooltip-trigger'
        onMouseMove={handleMouseMove}
        render={children}
        {...props}
      />
    );
  }
  return (
    <TooltipPrimitive.Trigger data-slot='tooltip-trigger' onMouseMove={handleMouseMove} {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  );
}

type TooltipPortalProps = Omit<React.ComponentProps<typeof TooltipPrimitive.Portal>, 'keepMounted'>;
function TooltipPortal(props: TooltipPortalProps) {
  const { isOpen } = useTooltip();
  return (
    <AnimatePresence>
      {isOpen && <TooltipPrimitive.Portal keepMounted data-slot='tooltip-portal' {...props} />}
    </AnimatePresence>
  );
}

type TooltipPositionerProps = React.ComponentProps<typeof TooltipPrimitive.Positioner>;
function TooltipPositioner(props: TooltipPositionerProps) {
  return <TooltipPrimitive.Positioner data-slot='tooltip-positioner' {...props} />;
}

type TooltipPopupProps = Omit<React.ComponentProps<typeof TooltipPrimitive.Popup>, 'render'> & HTMLMotionProps<'div'>;
function TooltipPopup({
  transition = { type: 'spring', stiffness: 300, damping: 25 },
  style,
  ...props
}: TooltipPopupProps) {
  const { x, y, followCursor, followCursorSpringOptions } = useTooltip();
  const translateX = useSpring(x, followCursorSpringOptions);
  const translateY = useSpring(y, followCursorSpringOptions);
  return (
    <TooltipPrimitive.Popup
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

type TooltipArrowProps = React.ComponentProps<typeof TooltipPrimitive.Arrow>;
function TooltipArrow(props: TooltipArrowProps) {
  return <TooltipPrimitive.Arrow data-slot='tooltip-arrow' {...props} />;
}

export {
  Tooltip,
  TooltipArrow,
  type TooltipArrowProps,
  type TooltipContextType,
  TooltipPopup,
  type TooltipPopupProps,
  TooltipPortal,
  type TooltipPortalProps,
  TooltipPositioner,
  type TooltipPositionerProps,
  type TooltipProps,
  TooltipProvider,
  type TooltipProviderProps,
  TooltipTrigger,
  type TooltipTriggerProps,
  useTooltip,
};
