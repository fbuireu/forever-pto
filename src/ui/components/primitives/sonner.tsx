'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      richColors
      closeButton
      position={props.position ?? 'bottom-center'}
      duration={5000}
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-[1.2rem] !border-[2.5px] !border-[var(--frame)] !bg-card !text-card-foreground !shadow-[var(--shadow-brutal-md)]',
          title: '!font-black !tracking-[-0.02em]',
          description: '!text-muted-foreground',
          actionButton:
            '!rounded-[0.9rem] !border-[2px] !border-[var(--frame)] !bg-[var(--color-brand-teal)] !text-[var(--color-brand-ink)] !shadow-[var(--shadow-brutal-xs)]',
          cancelButton:
            '!rounded-[0.9rem] !border-[2px] !border-[var(--frame)] !bg-[var(--surface-panel-alt)] !text-foreground !shadow-[var(--shadow-brutal-xs)]',
          closeButton: '!rounded-[0.8rem] !border-[2px] !border-[var(--frame)] !bg-card !text-foreground !opacity-100',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
