'use client';

import { usePremiumStore } from '@application/stores/premium';
import { cn } from '@const/lib/utils';
import { InfoIcon, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { useShallow } from 'zustand/react/shallow';

export const enum PremiumFeatureVariant {
  DEFAULT = 'default',
  STACK = 'stack',
}

const enum KeyboardKey {
  ENTER = 'Enter',
  SPACE = ' ',
}

interface PremiumFeatureProps {
  feature: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
  variant?: PremiumFeatureVariant;
  iconSize?: string;
  inlineDescription?: boolean;
}

export const PremiumFeature = ({
  feature,
  children,
  className,
  description,
  variant = PremiumFeatureVariant.DEFAULT,
  iconSize = 'w-6 h-6',
  inlineDescription = false,
}: PremiumFeatureProps) => {
  const { premiumKey, showUpgradeModal, checkExistingSession } = usePremiumStore(
    useShallow((state) => ({
      premiumKey: state.premiumKey,
      showUpgradeModal: state.showUpgradeModal,
      checkExistingSession: state.checkExistingSession,
    }))
  );
  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  if (premiumKey) {
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
        if (e.key === KeyboardKey.ENTER || e.key === KeyboardKey.SPACE) {
          e.preventDefault();
          showUpgradeModal(feature);
        }
      }}
    >
      <div className='blur-sm pointer-events-none'>{children}</div>
      <div className='absolute inset-0 flex items-center justify-center'>
        {description && !inlineDescription ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='relative flex items-center'>
                  <Lock className={cn(iconSize, 'text-muted-foreground')} />
                  <InfoIcon className='absolute -top-2 -right-2 size-4 text-muted-foreground' />
                </span>
              </TooltipTrigger>
              <TooltipContent className='w-50 text-pretty'>{description}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className={'flex flex-col items-center gap-2 text-center px-4'}>
            <Lock className={cn(iconSize, 'text-muted-foreground')} />
            {inlineDescription && <div className='text-sm text-muted-foreground'>{description}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
