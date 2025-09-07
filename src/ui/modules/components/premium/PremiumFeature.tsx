'use client';

import { usePremiumStore } from '@application/stores/premium';
import { cn } from '@const/lib/utils';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';

interface PremiumFeatureProps {
  feature: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export const PremiumFeature = ({ feature, children, className, description }: PremiumFeatureProps) => {
  const { isPremium, showUpgradeModal } = usePremiumStore();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative m-0', className)}>
      <button
        onClick={() => showUpgradeModal(feature)}
        className='p-2 w-full rounded-full cursor-pointer backdrop-blur-sm m-0'
      >
        <div className='blur-sm pointer-events-none'>{children}</div>
        <div className='absolute inset-0 flex items-center justify-center'>
          {description ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className='w-6 h-6 text-muted-foreground' />
                </TooltipTrigger>
                <TooltipContent className='w-50 text-pretty'>{description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Lock className='w-6 h-6 text-muted-foreground' />
          )}
        </div>
      </button>
    </div>
  );
};
