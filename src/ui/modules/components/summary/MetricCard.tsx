import { Badge } from '@const/components/ui/badge';
import { cn } from '@const/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';

export const enum MetricCardSize {
  DEFAULT = 'default',
  COMPACT = 'compact',
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  badge?: string | ReactNode;
  colorScheme: keyof typeof COLOR_SCHEMES;
  size?: MetricCardSize;
  className?: string;
  symbol?: string;
}

const COLOR_SCHEMES = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-500',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    icon: 'text-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    icon: 'text-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: 'text-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30',
  },
};

export const MetricCard = ({
  label,
  value,
  icon: Icon,
  badge,
  colorScheme,
  symbol,
  size = MetricCardSize.DEFAULT,
  className = '',
}: MetricCardProps) => {
  const colors = COLOR_SCHEMES[colorScheme];

  if (size === MetricCardSize.COMPACT) {
    return (
      <div className={cn('p-3', colors.bg, 'rounded-lg text-center', className)}>
        <Icon className={cn('w-4 h-4', colors.icon, 'mx-auto mb-1')} />
        <div className={cn('text-lg font-bold flex justify-center', colors.text)}>
          <SlidingNumber number={value} className={cn('text-lg font-bold', colors.text)} decimalPlaces={0} />
          {symbol}
        </div>
        <div className={cn('text-xs text-muted-foreground')}>{label}</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center p-4', colors.bg, 'rounded-lg', className)}>
      <span className={cn('text-xs text-muted-foreground mb-1')}>{label}</span>
      <div className={cn('flex items-center gap-2')}>
        <Icon className={cn('w-4 h-4', colors.icon)} />
        <span className={cn('text-xl font-bold flex', colors.text)}>
          <SlidingNumber number={value} decimalPlaces={0} />
          {symbol}
        </span>
      </div>
      {badge && (
        <Badge variant='outline' className={cn('text-xs mt-1', colors.badge)}>
          {badge}
        </Badge>
      )}
    </div>
  );
};
