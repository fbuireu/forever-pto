'use client';

import { usePremiumStore } from '@application/stores/premium';
import { cn } from '@const/lib/utils';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';

export const enum PremiumFeatureVariant {
  DEFAULT = 'default',
  STACK = 'stack',
}

interface PremiumFeatureProps {
  feature: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
  variant?: PremiumFeatureVariant;
  iconSize?: string;
}

export const PremiumFeature = ({
  feature,
  children,
  className,
  description,
  variant = PremiumFeatureVariant.DEFAULT,
  iconSize = 'w-6 h-6',
}: PremiumFeatureProps) => {
  const { isPremium, showUpgradeModal } = usePremiumStore();

  if (isPremium) {
    return <>{children}</>;
  }

  const getButtonClass = () => {
    switch (variant) {
      case PremiumFeatureVariant.STACK:
        return 'p-2 rounded-full cursor-pointer m-0 w-fit';
      case PremiumFeatureVariant.DEFAULT:
      default:
        return 'p-2 w-full rounded-full cursor-pointer backdrop-blur-sm m-0';
    }
  };

  return (
    <div
      className={cn('relative m-0 focus:outline-none', getButtonClass(), className)}
      role='button'
      tabIndex={0}
      aria-label={description ?? `Unlock premium feature: ${feature}`}
      onClick={() => showUpgradeModal(feature)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showUpgradeModal(feature);
        }
      }}
    >
      <div className='blur-sm pointer-events-none'>{children}</div>
      <div className='absolute inset-0 flex items-center justify-center'>
        {description ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className={cn(iconSize, 'text-muted-foreground')} />
              </TooltipTrigger>
              <TooltipContent className='w-50 text-pretty'>{description}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Lock className={cn(iconSize, 'text-muted-foreground')} />
        )}
      </div>
    </div>
  );
};
