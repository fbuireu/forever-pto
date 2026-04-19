import { SlidingNumber } from '@ui/components/animate/text/sliding-number';
import { Badge } from '@ui/components/primitives/badge';
import { cn } from '@ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { SVGMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

export const MetricCardSize = {
  DEFAULT: 'default',
  COMPACT: 'compact',
};

export type MetricCardSize = (typeof MetricCardSize)[keyof typeof MetricCardSize];

interface MetricCardProps {
  label: string;
  value: string | number;
  icon:
    | LucideIcon
    | React.ComponentType<
        {
          size?: number;
          className?: string;
        } & Omit<SVGMotionProps<SVGSVGElement>, 'animate'>
      >;
  badge?: string | ReactNode;
  colorScheme: keyof typeof COLOR_SCHEMES;
  size?: MetricCardSize;
  className?: string;
  symbol?: string;
}

const COLOR_SCHEMES = {
  blue: {
    bg: 'bg-[color-mix(in_srgb,var(--color-brand-teal)_18%,white_82%)] dark:bg-[color-mix(in_srgb,var(--color-brand-teal)_16%,black_84%)]',
    icon: 'text-[var(--color-brand-teal-deep)] dark:text-teal-300',
    text: 'text-[var(--color-brand-teal-deep)] dark:text-teal-200',
    badge:
      'bg-[color-mix(in_srgb,var(--color-brand-teal)_30%,white_70%)] text-[var(--color-brand-teal-deep)] dark:bg-[color-mix(in_srgb,var(--color-brand-teal)_22%,black_78%)]',
  },
  green: {
    bg: 'bg-[color-mix(in_srgb,var(--color-brand-yellow)_26%,white_74%)] dark:bg-[color-mix(in_srgb,var(--color-brand-yellow)_18%,black_82%)]',
    icon: 'text-[var(--color-brand-yellow-deep)] dark:text-yellow-300',
    text: 'text-[var(--color-brand-yellow-deep)] dark:text-yellow-200',
    badge:
      'bg-[color-mix(in_srgb,var(--color-brand-yellow)_40%,white_60%)] text-[var(--color-brand-yellow-deep)] dark:bg-[color-mix(in_srgb,var(--color-brand-yellow)_22%,black_78%)]',
  },
  purple: {
    bg: 'bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,white_80%)] dark:bg-[color-mix(in_srgb,var(--color-brand-purple)_16%,black_84%)]',
    icon: 'text-[var(--color-brand-purple-deep)] dark:text-purple-300',
    text: 'text-[var(--color-brand-purple-deep)] dark:text-purple-200',
    badge:
      'bg-[color-mix(in_srgb,var(--color-brand-purple)_32%,white_68%)] text-[var(--color-brand-purple-deep)] dark:bg-[color-mix(in_srgb,var(--color-brand-purple)_22%,black_78%)]',
  },
  amber: {
    bg: 'bg-[color-mix(in_srgb,var(--color-brand-orange)_20%,white_80%)] dark:bg-[color-mix(in_srgb,var(--color-brand-orange)_18%,black_82%)]',
    icon: 'text-[var(--color-brand-orange-deep)] dark:text-orange-300',
    text: 'text-[var(--color-brand-orange-deep)] dark:text-orange-200',
    badge:
      'bg-[color-mix(in_srgb,var(--color-brand-orange)_32%,white_68%)] text-[var(--color-brand-orange-deep)] dark:bg-[color-mix(in_srgb,var(--color-brand-orange)_22%,black_78%)]',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    icon: 'text-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/20',
    icon: 'text-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-200 text-cyan-700 dark:bg-cyan-900/30',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/20',
    icon: 'text-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-200 text-violet-700 dark:bg-violet-900/30',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/20',
    icon: 'text-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-200 text-rose-700 dark:bg-rose-900/30',
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
      <div
        className={cn(
          'p-3',
          colors.bg,
          'rounded-[1.1rem] border-[2.5px] border-[var(--frame)] text-center flex flex-col justify-between items-center shadow-[var(--shadow-brutal-sm)]',
          className
        )}
      >
        <Icon className={cn('w-4 h-4', colors.icon, 'mx-auto mb-1')} />
        <div className={cn('text-lg font-bold flex justify-center', colors.text)}>
          <SlidingNumber number={value} className={cn('text-lg font-bold', colors.text)} decimalPlaces={0} />
          {symbol}
        </div>
        <div className={cn('text-xs', colors.text)}>{label}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'items-center p-4',
        colors.bg,
        'rounded-[1.2rem] border-[2.5px] border-[var(--frame)] flex flex-col justify-between items-center shadow-[var(--shadow-brutal-sm)]',
        className
      )}
    >
      <span className={cn('mb-1 text-[0.72rem] font-black uppercase tracking-[0.08em]', colors.text)}>{label}</span>
      <div className={cn('flex items-center gap-2')}>
        <Icon className={cn('w-4 h-4', colors.icon)} />
        <span className={cn('text-xl font-bold flex', colors.text)}>
          <SlidingNumber number={value} decimalPlaces={0} />
          {symbol}
        </span>
      </div>
      {badge && (
        <Badge variant='outline' className={cn('text-xs mt-2', colors.badge)}>
          {badge}
        </Badge>
      )}
    </div>
  );
};
