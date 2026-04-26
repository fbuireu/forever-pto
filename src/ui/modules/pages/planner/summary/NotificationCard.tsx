import { cn } from '@ui/utils/utils';
import type { LucideIcon } from 'lucide-react';

interface NotificationCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  colorScheme: keyof typeof COLOR_SCHEMES;
  className?: string;
}

const COLOR_SCHEMES = {
  orange: {
    bg: 'bg-[color-mix(in_srgb,var(--color-brand-orange)_18%,white_82%)] dark:bg-[color-mix(in_srgb,var(--color-brand-orange)_16%,black_84%)]',
    icon: 'text-[var(--color-brand-orange-deep)] dark:text-orange-300',
    title: 'text-[var(--color-brand-orange-deep)] dark:text-orange-200',
    message: 'text-[var(--color-brand-ink)] dark:text-orange-100',
  },
  blue: {
    bg: 'bg-[color-mix(in_srgb,var(--color-brand-teal)_18%,white_82%)] dark:bg-[color-mix(in_srgb,var(--color-brand-teal)_16%,black_84%)]',
    icon: 'text-[var(--color-brand-teal-deep)] dark:text-teal-300',
    title: 'text-[var(--color-brand-teal-deep)] dark:text-teal-200',
    message: 'text-[var(--color-brand-ink)] dark:text-teal-100',
  },
  indigo: {
    bg: 'bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,white_80%)] dark:bg-[color-mix(in_srgb,var(--color-brand-purple)_16%,black_84%)]',
    icon: 'text-[var(--color-brand-purple-deep)] dark:text-purple-300',
    title: 'text-[var(--color-brand-purple-deep)] dark:text-purple-200',
    message: 'text-[var(--color-brand-ink)] dark:text-purple-100',
  },
};

export const NotificationCard = ({
  icon: Icon,
  title,
  children,
  colorScheme,
  className = '',
}: NotificationCardProps) => {
  const colors = COLOR_SCHEMES[colorScheme];

  return (
    <div
      className={cn(
        'rounded-[10px] border-[3px] border-[var(--frame)] p-4 shadow-[var(--shadow-brutal-sm)]',
        colors.bg,
        className
      )}
    >
      <div className={cn('flex items-center gap-2 mb-3')}>
        <Icon className={cn('w-4 h-4', colors.icon)} />
        <span className={cn('text-[0.72rem] font-display font-black uppercase tracking-[0.08em]', colors.title)}>
          {title}
        </span>
      </div>
      <div className={cn('text-sm flex justify-start font-medium', colors.message)}>{children}</div>
    </div>
  );
};
