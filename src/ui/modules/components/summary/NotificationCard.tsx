import { cn } from '@const/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NotificationCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  colorScheme: keyof typeof COLOR_SCHEMES;
  className?: string;
}

const COLOR_SCHEMES = {
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-500',
    title: 'text-orange-700 dark:text-orange-300',
    message: 'text-orange-800 dark:text-orange-200',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    title: 'text-blue-700 dark:text-blue-300',
    message: 'text-blue-800 dark:text-blue-200',
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
    <div className={cn('p-4', colors.bg, 'rounded-lg border', colors.border, className)}>
      <div className={cn('flex items-center gap-2 mb-2')}>
        <Icon className={cn('w-4 h-4', colors.icon)} />
        <span className={cn('text-sm font-medium', colors.title)}>{title}</span>
      </div>
      <div className={cn('text-sm flex justify-start', colors.message)}>{children}</div>
    </div>
  );
};
