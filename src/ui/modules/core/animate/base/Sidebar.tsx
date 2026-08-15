'use client';

import { useIsMobile } from '@ui/hooks/useMobile';
import { Button } from '@ui/modules/core/primitives/Button';
import { cn } from '@ui/utils/cn';
import { setCookie } from '@ui/utils/cookie';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { AnimatePresence, m, type Transition } from 'motion/react';
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type MouseEvent,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { MotionHighlight, MotionHighlightItem } from '../effects/MotionHighlight';
import { PanelLeftIcon } from '../icons/PanelLeft';
import { Slot } from './Slot';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';

export const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '20rem';
const SIDEBAR_WIDTH_MOBILE = '20rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = use(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

type SidebarProviderProps = ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        setInternalOpen(openState);
      }
      setCookie({ name: SIDEBAR_COOKIE_NAME, value: String(openState), maxAge: SIDEBAR_COOKIE_MAX_AGE }).catch(
        () => {}
      );
    },
    [setOpenProp, open]
  );

  const toggleSidebar = useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen]);

  useEffect(() => {
    if (openProp !== undefined) return;
    const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)`));
    if (match) {
      setInternalOpen(match[1] !== 'false');
    }
  }, [openProp]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  useEffect(() => {
    if (!openMobile) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMobile(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [openMobile]);

  const state = open ? 'expanded' : 'collapsed';

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={200}>
        <div
          data-slot='sidebar-wrapper'
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as CSSProperties
          }
          className={cn(' group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

type SidebarProps = ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  containerClassName?: string;
  animateOnHover?: boolean;
  transition?: Transition;
};

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  animateOnHover = true,
  containerClassName,
  transition = { type: 'spring', stiffness: 350, damping: 35 },
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <MotionHighlight
        enabled={animateOnHover}
        hover
        controlledItems
        mode='parent'
        containerClassName={containerClassName}
        transition={transition}
      >
        <div
          data-slot='sidebar'
          className={cn(
            'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col rounded-[14px] border-[3px] border-(--frame) shadow-(--shadow-brutal-lg)',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </MotionHighlight>
    );
  }

  if (isMobile) {
    return (
      <AnimatePresence
        onExitComplete={() => {
          document.body.style.pointerEvents = '';
        }}
      >
        {openMobile && (
          <>
            <m.div
              key='sidebar-backdrop'
              className='fixed inset-0 z-51 bg-black/80'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenMobile(false)}
              aria-hidden='true'
            />
            <m.div
              key='sidebar-drawer'
              role='dialog'
              aria-modal='false'
              aria-label='Sidebar'
              data-sidebar='sidebar'
              data-slot='sidebar'
              data-mobile='true'
              className={cn(
                'bg-sidebar text-sidebar-foreground fixed inset-y-0 z-51 flex h-full flex-col border-[3px] border-(--frame) shadow-(--shadow-brutal-xl)',
                side === 'right' ? 'right-0 rounded-l-[14px]' : 'left-0 rounded-r-[14px]'
              )}
              style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE, width: 'var(--sidebar-width)' } as CSSProperties}
              initial={{ x: side === 'right' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: side === 'right' ? '100%' : '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            >
              <MotionHighlight
                enabled={animateOnHover}
                hover
                controlledItems
                mode='parent'
                containerClassName={cn('h-full', containerClassName)}
                transition={transition}
              >
                <div className='flex h-full w-full flex-col'>{children}</div>
              </MotionHighlight>
            </m.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div
      className='group peer text-sidebar-foreground hidden md:block'
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot='sidebar'
    >
      <div
        data-slot='sidebar-gap'
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-400 ease-[cubic-bezier(0.7,-0.15,0.25,1.15)]',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)'
        )}
      />
      <div
        data-slot='sidebar-container'
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-400 ease-[cubic-bezier(0.75,0,0.25,1)] md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:-left-(--sidebar-width)'
            : 'right-0 group-data-[collapsible=offcanvas]:-right-(--sidebar-width)',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l'
        )}
      >
        <MotionHighlight
          enabled={animateOnHover}
          hover
          controlledItems
          mode='parent'
          containerClassName={cn('w-full h-full', containerClassName)}
          transition={transition}
        >
          <div
            data-slot='sidebar-content'
            className='bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col rounded-[14px] border-[3px] border-(--frame) shadow-(--shadow-brutal-lg)'
          >
            {children}
          </div>
        </MotionHighlight>
      </div>
    </div>
  );
}

type SidebarTriggerProps = ComponentProps<typeof Button>;

function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-slot='sidebar-trigger'
      data-sidebar='trigger'
      variant='ghost'
      size='icon'
      className={cn(
        'relative z-50 size-11 rounded-xl bg-accent text-accent-foreground border-[3px] border-(--color-brand-ink) shadow-(--shadow-brutal-xs) transition-[transform,box-shadow] hover:bg-accent hover:text-accent-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-(--shadow-brutal-sm) active:bg-accent active:text-accent-foreground active:translate-x-0.5 active:translate-y-0.5 active:shadow-(--shadow-brutal-btn-active) cursor-pointer',
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon className='size-full' />
      <span className='sr-only'>Toggle Sidebar</span>
    </Button>
  );
}

type SidebarInsetProps = ComponentProps<'main'>;

function SidebarInset({ className, ...props }: SidebarInsetProps) {
  return (
    <main
      data-slot='sidebar-inset'
      className={cn(
        'bg-background relative flex min-h-svh flex-1 flex-col',
        'peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))] md:peer-data-[variant=inset]:m-2.25 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-3 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-[14px] md:peer-data-[variant=inset]:border-[3px] md:peer-data-[variant=inset]:border-(--frame) md:peer-data-[variant=inset]:shadow-(--shadow-brutal-lg)',
        className
      )}
      {...props}
    />
  );
}

type SidebarHeaderProps = ComponentProps<'div'>;

function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
  return (
    <div
      data-slot='sidebar-header'
      data-sidebar='header'
      className={cn('flex flex-col gap-3 p-3', className)}
      {...props}
    />
  );
}

type SidebarFooterProps = ComponentProps<'div'>;

function SidebarFooter({ className, ...props }: SidebarFooterProps) {
  return (
    <div
      data-slot='sidebar-footer'
      data-sidebar='footer'
      className={cn('flex flex-col gap-3 p-3', className)}
      {...props}
    />
  );
}

type SidebarContentProps = ComponentProps<'div'>;

function SidebarContent({ className, ...props }: SidebarContentProps) {
  return (
    <div
      data-slot='sidebar-content'
      data-sidebar='content'
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-1 pb-2 group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-2',
        className
      )}
      {...props}
    />
  );
}

type SidebarGroupProps = ComponentProps<'div'>;

function SidebarGroup({ className, ...props }: SidebarGroupProps) {
  return (
    <div
      data-slot='sidebar-group'
      data-sidebar='group'
      className={cn('relative flex w-full min-w-0 flex-col rounded-xl bg-(--surface-panel-inset) p-2.5', className)}
      {...props}
    />
  );
}

type SidebarGroupLabelProps = ComponentProps<'div'> & {
  asChild?: boolean;
};

function SidebarGroupLabel({ className, asChild = false, ...props }: SidebarGroupLabelProps) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot='sidebar-group-label'
      data-sidebar='group-label'
      className={cn(
        'text-sidebar-foreground/75 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-[8px] px-2 text-[0.68rem] font-mono font-bold uppercase tracking-widest outline-hidden transition-[margin,opa] duration-200 ease-linear focus-visible:ring-[3px] [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className
      )}
      {...props}
    />
  );
}

type SidebarMenuProps = ComponentProps<'ul'>;

function SidebarMenu({ className, ...props }: SidebarMenuProps) {
  return (
    <ul
      data-slot='sidebar-menu'
      data-sidebar='menu'
      className={cn('flex w-full min-w-0 flex-col gap-2', className)}
      {...props}
    />
  );
}

type SidebarMenuItemProps = ComponentProps<'li'>;

function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps) {
  return (
    <li
      data-slot='sidebar-menu-item'
      data-sidebar='menu-item'
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  'relative hit-area-stable peer/menu-button flex w-full items-center gap-2 rounded-[8px] border-[3px] border-[var(--frame)] p-2.5 text-left text-sm font-medium outline-hidden ring-sidebar-ring transition-[width,height,padding,transform,box-shadow] shadow-[var(--shadow-brutal-xs)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[var(--shadow-brutal-sm)] focus-visible:ring-[3px] active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-black data-[active=true]:text-sidebar-accent-foreground data-[active=true]:border-[var(--frame)] data-[active=true]:shadow-[var(--shadow-brutal-xs)] data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-[var(--surface-panel)] shadow-[var(--shadow-brutal-xs)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[var(--shadow-brutal-sm)]',
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const sidebarMenuButtonActiveVariants = cva('', {
  variants: {
    variant: {
      default:
        'bg-sidebar-accent text-sidebar-accent-foreground border-[var(--frame)] shadow-[var(--shadow-brutal-xs)]',
      outline:
        'bg-sidebar-accent text-sidebar-accent-foreground border-[var(--frame)] shadow-[var(--shadow-brutal-xs)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type SidebarMenuButtonProps = ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>;

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const { isMobile, state, setOpen } = useSidebar();

  const expandAndForward = (e: MouseEvent<HTMLButtonElement>) => {
    if (state === 'collapsed' && !isMobile) setOpen(true);
    props.onClick?.(e);
  };

  const button = (
    <MotionHighlightItem activeClassName={sidebarMenuButtonActiveVariants({ variant })}>
      <Comp
        data-slot='sidebar-menu-button'
        data-sidebar='menu-button'
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
        onClick={expandAndForward}
      />
    </MotionHighlightItem>
  );

  if (!tooltip) {
    return button;
  }

  if (isMobile || state !== 'collapsed') {
    return button;
  }

  if (typeof tooltip === 'string') {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side='right' align='center' {...tooltip} />
    </Tooltip>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
