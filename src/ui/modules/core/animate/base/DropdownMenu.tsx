'use client';

import { Menu as DropdownMenuPrimitive } from '@base-ui/react/menu';
import { cn } from '@ui/utils/utils';
import { Circle } from 'lucide-react';
import { AnimatePresence, type HTMLMotionProps, m, type Transition } from 'motion/react';
import * as React from 'react';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { MotionHighlight, MotionHighlightItem } from '../effects/MotionHighlight';
import { Check } from '../icons/Check';
import { ChevronRight } from '../icons/ChevronRight';

type DropdownMenuContextType = {
  isOpen: boolean;
  highlightTransition: Transition;
  animateOnHover: boolean;
};

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

const useDropdownMenu = (): DropdownMenuContextType => {
  const context = use(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

type DropdownMenuProps = React.ComponentProps<typeof DropdownMenuPrimitive.Root> & {
  transition?: Transition;
  animateOnHover?: boolean;
};

function DropdownMenu({
  children,
  transition = { type: 'spring', stiffness: 350, damping: 35 },
  animateOnHover = true,
  ...props
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(props?.open ?? props?.defaultOpen ?? false);

  useEffect(() => {
    if (props?.open !== undefined) setIsOpen(props.open);
  }, [props?.open]);

  const handleOpenChange = useCallback(
    (...args: Parameters<NonNullable<DropdownMenuProps['onOpenChange']>>) => {
      setIsOpen(args[0]);
      props.onOpenChange?.(...args);
    },
    [props.onOpenChange]
  );

  const contextValue = useMemo(
    () => ({ isOpen, highlightTransition: transition, animateOnHover }),
    [isOpen, transition, animateOnHover]
  );

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <DropdownMenuPrimitive.Root data-slot='dropdown-menu' {...props} onOpenChange={handleOpenChange}>
        {children}
      </DropdownMenuPrimitive.Root>
    </DropdownMenuContext.Provider>
  );
}

type DropdownMenuTriggerProps = React.ComponentProps<typeof DropdownMenuPrimitive.Trigger> & { asChild?: boolean };

function DropdownMenuTrigger({ asChild, children, ...props }: DropdownMenuTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <DropdownMenuPrimitive.Trigger
        data-slot='dropdown-menu-trigger'
        render={children as React.ReactElement}
        {...props}
      />
    );
  }
  return (
    <DropdownMenuPrimitive.Trigger data-slot='dropdown-menu-trigger' {...props}>
      {children}
    </DropdownMenuPrimitive.Trigger>
  );
}

type DropdownMenuGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.Group>;

function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  return <DropdownMenuPrimitive.Group data-slot='dropdown-menu-group' {...props} />;
}

type DropdownMenuPortalProps = React.ComponentProps<typeof DropdownMenuPrimitive.Portal>;

function DropdownMenuPortal(props: DropdownMenuPortalProps) {
  return <DropdownMenuPrimitive.Portal data-slot='dropdown-menu-portal' {...props} />;
}

type DropdownMenuSubProps = React.ComponentProps<typeof DropdownMenuPrimitive.SubmenuRoot>;

function DropdownMenuSub(props: DropdownMenuSubProps) {
  return <DropdownMenuPrimitive.SubmenuRoot data-slot='dropdown-menu-sub' {...props} />;
}

type DropdownMenuRadioGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>;

function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  return <DropdownMenuPrimitive.RadioGroup data-slot='dropdown-menu-radio-group' {...props} />;
}

type DropdownMenuSubTriggerProps = Omit<React.ComponentProps<typeof DropdownMenuPrimitive.SubmenuTrigger>, 'render'> &
  HTMLMotionProps<'div'> & {
    inset?: boolean;
  };

function DropdownMenuSubTrigger({ className, children, inset, disabled, ...props }: DropdownMenuSubTriggerProps) {
  return (
    <MotionHighlightItem disabled={disabled}>
      <DropdownMenuPrimitive.SubmenuTrigger
        {...(props as React.ComponentProps<typeof DropdownMenuPrimitive.SubmenuTrigger>)}
        disabled={disabled}
        render={
          <m.div
            data-slot='dropdown-menu-sub-trigger'
            data-inset={inset}
            data-disabled={disabled}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "[&:not([data-highlight])]:focus:bg-accent focus:text-accent-foreground [&:not([data-highlight])]:data-[open]:bg-accent data-[open]:text-accent-foreground data-[open]:[&_[data-chevron]]:rotate-90 [&_[data-chevron]]:transition-transform [&_[data-chevron]]:duration-150 [&_[data-chevron]]:ease-in-out [&_svg:not([class*='text-'])]:text-muted-foreground relative z-[1] flex cursor-default select-none items-center gap-2 rounded-[8px] border border-transparent px-3 py-2 text-sm font-medium outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
              inset && 'pl-8',
              className
            )}
          />
        }
      >
        {children}
        <ChevronRight data-chevron className='ml-auto' animateOnHover />
      </DropdownMenuPrimitive.SubmenuTrigger>
    </MotionHighlightItem>
  );
}

type DropdownMenuSubContentProps = Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Popup>, 'render'>;

function DropdownMenuSubContent({ className, ...props }: Readonly<DropdownMenuSubContentProps>) {
  return (
    <DropdownMenuPrimitive.Positioner positionMethod='fixed' className='z-50'>
      <DropdownMenuPrimitive.Popup
        data-slot='dropdown-menu-sub-content'
        className={cn(
          'z-50 min-w-32 overflow-hidden rounded-[10px] border-[3px] border-[var(--frame)] bg-popover p-1.5 text-popover-foreground shadow-[var(--shadow-brutal-md)]',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Positioner>
  );
}

type DropdownMenuContentProps = Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Popup>, 'render'> &
  HTMLMotionProps<'div'> & {
    transition?: Transition;
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
  };

function DropdownMenuContent({
  className,
  children,
  sideOffset = 4,
  align = 'start',
  transition = { duration: 0.2 },
  ...props
}: DropdownMenuContentProps) {
  const { isOpen, highlightTransition, animateOnHover } = useDropdownMenu();

  return (
    <AnimatePresence>
      {isOpen && (
        <DropdownMenuPrimitive.Portal keepMounted data-slot='dropdown-menu-portal'>
          <DropdownMenuPrimitive.Positioner
            sideOffset={sideOffset}
            align={align}
            positionMethod='fixed'
            className='z-50'
          >
            <DropdownMenuPrimitive.Popup
              render={
                <m.div
                  key='dropdown-menu-content'
                  data-slot='dropdown-menu-content'
                  className={cn(
                    'z-50 max-h-(--available-height) min-w-32 overflow-y-auto overflow-x-hidden rounded-[10px] border-[3px] border-[var(--frame)] bg-popover p-1.5 text-popover-foreground shadow-[var(--shadow-brutal-md)] origin-(--transform-origin)',
                    className
                  )}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={transition}
                  style={{ willChange: 'opacity, transform' }}
                  {...(props as HTMLMotionProps<'div'>)}
                />
              }
            >
              <MotionHighlight
                hover
                className='rounded-[8px]'
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

type DropdownMenuItemProps = Omit<React.ComponentProps<typeof DropdownMenuPrimitive.Item>, 'render'> &
  HTMLMotionProps<'div'> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
  };

function DropdownMenuItem({
  className,
  children,
  inset,
  disabled,
  variant = 'default',
  ...props
}: DropdownMenuItemProps) {
  return (
    <MotionHighlightItem
      activeClassName={cn(
        variant === 'default' && 'bg-accent',
        variant === 'destructive' && 'bg-destructive/10 dark:bg-destructive/20'
      )}
      disabled={disabled}
    >
      <DropdownMenuPrimitive.Item
        {...(props as React.ComponentProps<typeof DropdownMenuPrimitive.Item>)}
        disabled={disabled}
        render={
          <m.div
            data-slot='dropdown-menu-item'
            data-inset={inset}
            data-variant={variant}
            data-disabled={disabled}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "[&:not([data-highlight])]:focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive [&:not([data-highlight])]:data-[variant=destructive]:focus:bg-destructive/10 dark:[&:not([data-highlight])]:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative z-[1] flex cursor-default select-none items-center gap-2 rounded-[8px] border border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
              inset && 'pl-8',
              className
            )}
          />
        }
      >
        {children}
      </DropdownMenuPrimitive.Item>
    </MotionHighlightItem>
  );
}

type DropdownMenuCheckboxItemProps = Omit<React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>, 'render'> &
  HTMLMotionProps<'div'>;

function DropdownMenuCheckboxItem({ className, children, checked, disabled, ...props }: DropdownMenuCheckboxItemProps) {
  return (
    <MotionHighlightItem disabled={disabled}>
      <DropdownMenuPrimitive.CheckboxItem
        {...(props as React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>)}
        checked={checked}
        disabled={disabled}
        render={
          <m.div
            data-slot='dropdown-menu-checkbox-item'
            data-disabled={disabled}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "[&:not([data-highlight])]:focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-[8px] border border-transparent py-2 pr-3 pl-9 text-sm font-medium outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              className
            )}
          />
        }
      >
        <span className='absolute left-2 flex size-3.5 items-center justify-center'>
          <DropdownMenuPrimitive.CheckboxItemIndicator data-slot='dropdown-menu-checkbox-item-indicator'>
            <Check className='size-4' animateOnHover />
          </DropdownMenuPrimitive.CheckboxItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.CheckboxItem>
    </MotionHighlightItem>
  );
}

type DropdownMenuRadioItemProps = Omit<React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>, 'render'> &
  HTMLMotionProps<'div'>;

function DropdownMenuRadioItem({ className, children, disabled, ...props }: DropdownMenuRadioItemProps) {
  return (
    <MotionHighlightItem disabled={disabled}>
      <DropdownMenuPrimitive.RadioItem
        {...(props as React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>)}
        disabled={disabled}
        render={
          <m.div
            data-slot='dropdown-menu-radio-item'
            data-disabled={disabled}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "[&:not([data-highlight])]:focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-[8px] border border-transparent py-2 pr-3 pl-9 text-sm font-medium outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              className
            )}
          />
        }
      >
        <span className='pointer-events-none absolute left-2 flex size-3.5 items-center justify-center'>
          <DropdownMenuPrimitive.RadioItemIndicator data-slot='dropdown-menu-radio-item-indicator'>
            <Circle className='size-2 fill-current' />
          </DropdownMenuPrimitive.RadioItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.RadioItem>
    </MotionHighlightItem>
  );
}

type DropdownMenuLabelProps = React.ComponentProps<typeof DropdownMenuPrimitive.GroupLabel> & {
  inset?: boolean;
};

function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps) {
  return (
    <DropdownMenuPrimitive.GroupLabel
      data-slot='dropdown-menu-label'
      data-inset={inset}
      className={cn(
        'px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.08em] text-muted-foreground',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  );
}

type DropdownMenuSeparatorProps = React.ComponentProps<typeof DropdownMenuPrimitive.Separator>;

function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot='dropdown-menu-separator'
      className={cn('-mx-1 my-1 h-[2px] bg-[var(--frame)]/15', className)}
      {...props}
    />
  );
}

type DropdownMenuShortcutProps = React.ComponentProps<'span'>;

function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps) {
  return (
    <span
      data-slot='dropdown-menu-shortcut'
      className={cn('text-muted-foreground ml-auto text-[0.68rem] font-bold tracking-[0.08em] uppercase', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  type DropdownMenuCheckboxItemProps,
  DropdownMenuContent,
  type DropdownMenuContentProps,
  DropdownMenuGroup,
  type DropdownMenuGroupProps,
  DropdownMenuItem,
  type DropdownMenuItemProps,
  DropdownMenuLabel,
  type DropdownMenuLabelProps,
  DropdownMenuPortal,
  type DropdownMenuPortalProps,
  type DropdownMenuProps,
  DropdownMenuRadioGroup,
  type DropdownMenuRadioGroupProps,
  DropdownMenuRadioItem,
  type DropdownMenuRadioItemProps,
  DropdownMenuSeparator,
  type DropdownMenuSeparatorProps,
  DropdownMenuShortcut,
  type DropdownMenuShortcutProps,
  DropdownMenuSub,
  DropdownMenuSubContent,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubProps,
  DropdownMenuSubTrigger,
  type DropdownMenuSubTriggerProps,
  DropdownMenuTrigger,
  type DropdownMenuTriggerProps,
};
