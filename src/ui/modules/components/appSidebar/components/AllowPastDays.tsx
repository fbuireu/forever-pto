'use client';

import { useFiltersStore } from '@application/stores/filters';
import { Field, Label } from '@headlessui/react';
import { InfoIcon, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Switch } from 'src/components/animate-ui/headless/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { PremiumFeature } from '../../premium/PremiumFeature';
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
    <Field className='space-y-2 w-full' data-tutorial='allow-past-days'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='allow-past-days'>
        <Undo2 size={16} /> {t('title')}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger aria-label={t('tooltipLabel')} className='ml-auto cursor-help'>
              <InfoIcon className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
            </TooltipTrigger>
            <TooltipContent className='w-50 text-pretty'>{t('tooltip')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
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
    </Field>
  );
};
