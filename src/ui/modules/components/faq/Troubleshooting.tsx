'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { useShallow } from 'zustand/react/shallow';
import { getTotalMonths } from '../utils/helpers';

export const Troubleshooting = () => {
  const locale = useLocale();
  const t = useTranslations('troubleshooting');
  const { carryOverMonths, country, region, year, allowPastDays, ptoDays, strategy } = useFiltersStore(
    useShallow((state) => ({
      carryOverMonths: state.carryOverMonths,
      country: state.country,
      region: state.region,
      year: state.year,
      allowPastDays: state.allowPastDays,
      ptoDays: state.ptoDays,
      strategy: state.strategy,
    }))
  );

  const {
    resetToDefaults: resetHolidaysStore,
    fetchHolidays,
    generateSuggestions,
  } = useHolidaysStore(
    useShallow((state) => ({
      resetToDefaults: state.resetToDefaults,
      fetchHolidays: state.fetchHolidays,
      generateSuggestions: state.generateSuggestions,
    }))
  );
  const [cleared, setCleared] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetToDefaults = () => {
    startTransition(async () => {
      try {
        resetHolidaysStore();

        await fetchHolidays({ country, region, year, locale, carryOverMonths });

        generateSuggestions({
          year: parseInt(year),
          ptoDays,
          allowPastDays,
          months: getTotalMonths({ carryOverMonths, year }),
          strategy,
          locale,
        });

        setCleared(true);

        toast.success(t('successTitle'), {
          description: t('successDescription'),
        });
      } catch (error) {
        getBetterStackInstance().logError('Error resetting to defaults', error, { component: 'Troubleshooting' });
        toast.error(t('errorTitle'), {
          description: t('errorDescription'),
        });
      }
    });
  };

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
      <Button variant='destructive' onClick={resetToDefaults} disabled={cleared || isPending}>
        {isPending ? t('clearing') : cleared ? t('cleared') : t('resetButton')}
      </Button>
    </div>
  );
};
