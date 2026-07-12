'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
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
import { type ComponentProps, isValidElement, type RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

type TooltipContextType = {
  isOpen: boolean;
  setIsOpen: TooltipProps['onOpenChange'];
  /** Programmatic open/close (tap-to-toggle, outside dismiss) without Base UI event details. */
  setOpen: (open: boolean) => void;
  x: MotionValue<number>;
  y: MotionValue<number>;
  followCursor?: boolean | 'x' | 'y';
  followCursorSpringOptions?: SpringOptions;
  triggerRef: RefObject<HTMLElement | null>;
};
const [LocalTooltipProvider, useTooltip] = getStrictContext<TooltipContextType>('TooltipContext');

type TooltipProviderProps = ComponentProps<typeof TooltipPrimitive.Provider>;
function TooltipProvider(props: TooltipProviderProps) {
  return <TooltipPrimitive.Provider data-slot='tooltip-provider' {...props} />;
}

type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root> & {
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
  const triggerRef = useRef<HTMLElement | null>(null);

  const setOpen = useCallback(
    (open: boolean) => {
      (setIsOpen as unknown as (open: boolean, eventDetails?: unknown) => void)?.(open, undefined);
    },
    [setIsOpen]
  );

  // Touch devices open the tooltip by tapping the trigger (see TooltipTrigger),
  // and nothing hover-based ever closes it — dismiss on the next press outside.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (triggerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [isOpen, setOpen]);

  const tooltipContextValue = useMemo(
    () => ({ isOpen, setIsOpen, setOpen, x, y, followCursor, followCursorSpringOptions, triggerRef }),
    [isOpen, setIsOpen, setOpen, x, y, followCursor, followCursorSpringOptions]
  );
  return (
    <LocalTooltipProvider value={tooltipContextValue}>
      {/* Controlled: the tap-to-open path (touch devices) must drive Base UI's
          internal state too, or the portal renders inside a [hidden] subtree */}
      <TooltipPrimitive.Root data-slot='tooltip' {...props} open={isOpen} onOpenChange={setIsOpen} />
    </LocalTooltipProvider>
  );
}

type TooltipTriggerProps = ComponentProps<typeof TooltipPrimitive.Trigger> & { asChild?: boolean };
function TooltipTrigger({ onMouseMove, onClick, asChild, children, ...props }: TooltipTriggerProps) {
  const { isOpen, setOpen, x, y, followCursor, triggerRef } = useTooltip();
  const handleMouseMove = (event: Parameters<NonNullable<TooltipTriggerProps['onMouseMove']>>[0]) => {
    onMouseMove?.(event);
    const target = event.currentTarget.getBoundingClientRect();
    if (followCursor === 'x' || followCursor === true) x.set((event.clientX - target.left - target.width / 2) / 2);
    if (followCursor === 'y' || followCursor === true) y.set((event.clientY - target.top - target.height / 2) / 2);
  };
  // Base UI tooltips only open on hover/focus-visible, which never happens on
  // touch — toggle on tap when the device cannot hover.
  const handleClick = (event: Parameters<NonNullable<TooltipTriggerProps['onClick']>>[0]) => {
    onClick?.(event);
    triggerRef.current = event.currentTarget as HTMLElement;
    if (globalThis.matchMedia?.('(hover: none)').matches) {
      setOpen(!isOpen);
    }
  };
  if (asChild && isValidElement(children)) {
    return (
      <TooltipPrimitive.Trigger
        data-slot='tooltip-trigger'
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        render={children}
        {...props}
      />
    );
  }
  return (
    <TooltipPrimitive.Trigger
      data-slot='tooltip-trigger'
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      {...props}
    >
      {children}
    </TooltipPrimitive.Trigger>
  );
}

type TooltipPortalProps = Omit<ComponentProps<typeof TooltipPrimitive.Portal>, 'keepMounted'>;
function TooltipPortal(props: TooltipPortalProps) {
  const { isOpen } = useTooltip();
  return (
    <AnimatePresence>
      {isOpen && <TooltipPrimitive.Portal keepMounted data-slot='tooltip-portal' {...props} />}
    </AnimatePresence>
  );
}

type TooltipPositionerProps = ComponentProps<typeof TooltipPrimitive.Positioner>;
function TooltipPositioner(props: TooltipPositionerProps) {
  return <TooltipPrimitive.Positioner data-slot='tooltip-positioner' {...props} />;
}

type TooltipPopupProps = Omit<ComponentProps<typeof TooltipPrimitive.Popup>, 'render'> & HTMLMotionProps<'div'>;
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

type TooltipArrowProps = ComponentProps<typeof TooltipPrimitive.Arrow>;
function TooltipArrow(props: TooltipArrowProps) {
  return <TooltipPrimitive.Arrow data-slot='tooltip-arrow' {...props} />;
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
