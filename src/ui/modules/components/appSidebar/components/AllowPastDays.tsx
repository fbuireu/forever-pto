'use client';

import { useFiltersStore } from '@application/stores/filters';
import { InfoIcon, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Switch } from '@ui/components/animate/headless/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ui/components/animate/base/tooltip';
import { useShallow } from 'zustand/react/shallow';
import { PremiumFeature } from '../../premium/PremiumFeature';

export const AllowPastDays = () => {
  const t = useTranslations('sidebar.allowPastDays');
  const { allowPastDays, setAllowPastDays } = useFiltersStore(
    useShallow((state) => ({
      allowPastDays: state.allowPastDays,
      setAllowPastDays: state.setAllowPastDays,
    }))
  );

  return (
    <div className='space-y-2 w-full' data-tutorial='allow-past-days'>
      <label className='flex gap-2 my-2 text-sm font-normal' htmlFor='allow-past-days'>
        <Undo2 size={16} /> {t('title')}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger aria-label={t('tooltipLabel')} className='ml-auto cursor-help'>
              <InfoIcon className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
            </TooltipTrigger>
            <TooltipContent className='w-50 text-pretty'>{t('tooltip')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </label>
      <PremiumFeature feature={t('title')}>
        <div className='flex gap-2 w-full'>
          <Switch
            checked={allowPastDays}
            id='allow-past-days'
            onChange={(checked) => setAllowPastDays(checked as boolean)}
          />
          <p className='font-normal text-sm'>{allowPastDays ? t('enabled') : t('disabled')}</p>
        </div>
      </PremiumFeature>
    </div>
  );
};
