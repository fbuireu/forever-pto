'use client';

import { useFiltersStore } from '@application/stores/filters';
import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipProvider } from '@ui/modules/core/animate/base/Tooltip';
import { Switch } from '@ui/modules/core/animate/primitives/base/Switch';
import { PremiumFeature } from '@ui/modules/premium/PremiumFeature';
import { Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

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
      <label className='flex gap-2 my-2 text-sm font-mono font-normal' htmlFor='allow-past-days'>
        <Undo2 size={16} /> {t('title')}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipInfoTrigger aria-label={t('tooltipLabel')} />
            <TooltipContent className='w-50 text-pretty'>{t('tooltip')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </label>
      <PremiumFeature feature={t('title')}>
        <div className='flex gap-2 w-full items-center'>
          <Switch checked={allowPastDays} id='allow-past-days' onCheckedChange={setAllowPastDays} />
          <p className='font-normal text-sm'>{allowPastDays ? t('enabled') : t('disabled')}</p>
        </div>
      </PremiumFeature>
    </div>
  );
};
