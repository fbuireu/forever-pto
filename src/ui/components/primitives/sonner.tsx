'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      closeButton
      position={props.position ?? 'bottom-center'}
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-[10px] !border-[3px] !border-[var(--frame)] ![background:var(--toast-bg,var(--surface-panel))] !text-foreground !shadow-[5px_5px_0_0_var(--frame)]',
          title: '!font-black !font-display !tracking-[-0.02em] !text-[15px]',
          description: '!text-[13px] !leading-[1.4]',
          success: '![--toast-bg:var(--color-brand-green)]',
          warning: '![--toast-bg:var(--accent)]',
          error:
            '![--toast-bg:var(--color-brand-red)] !text-white [&_[data-title]]:!text-white [&_[data-description]]:!text-white/80',
          info: '![--toast-bg:var(--color-brand-sky)]',
          icon: '!size-8 !rounded-[6px] !border-[2.5px] !border-[var(--frame)] !bg-white !text-foreground !font-black !flex !items-center !justify-center',
          actionButton:
            '!rounded-[8px] !border-[3px] !border-[var(--frame)] !bg-[var(--color-brand-teal)] !text-[var(--color-brand-ink)] !shadow-[var(--shadow-brutal-xs)]',
          cancelButton:
            '!rounded-[8px] !border-[3px] !border-[var(--frame)] !bg-[var(--surface-panel-alt)] !text-foreground !shadow-[var(--shadow-brutal-xs)]',
          closeButton:
            '!rounded-[8px] !border-[3px] !border-[var(--frame)] !bg-[var(--surface-panel)] !text-foreground !opacity-100 !size-7 [&_svg]:!size-4 [&_svg]:m-auto shadow-[var(--shadow-brutal-xs)]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
