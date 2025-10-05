'use client';

import { usePremiumStore } from '@application/stores/premium';
import { cn } from '@const/lib/utils';
import { InfoIcon, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { useShallow } from 'zustand/react/shallow';
import { getButtonClass } from './utils/helpers';

export const PremiumFeatureVariant = {
  DEFAULT: 'default',
  STACK: 'stack',
} as const;

export type PremiumFeatureVariant = (typeof PremiumFeatureVariant)[keyof typeof PremiumFeatureVariant];

const KeyboardKey = {
  ENTER: 'Enter',
  SPACE: ' ',
} as const;

type KeyboardKey = (typeof KeyboardKey)[keyof typeof KeyboardKey];

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

  return (
    <div
      className={cn('relative m-0 focus:outline-none', getButtonClass(variant), className)}
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
      <div
        className={cn(
          'absolute inset-0 flex items-center',
          variant === PremiumFeatureVariant.STACK ? 'justify-start -translate-x-1' : 'justify-center'
        )}
      >
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
            {inlineDescription && (
              <div className='text-sm text-foreground [text-shadow:0_2px_4px_rgba(0,0,0,1)]'>{description}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
