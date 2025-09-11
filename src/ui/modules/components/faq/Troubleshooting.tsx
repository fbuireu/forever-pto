'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { getTotalMonths } from '../utils/helpers';

export const Troubleshooting = () => {
  const locale = useLocale();
  const { resetToDefaults: resetHolidaysStore, fetchHolidays } = useHolidaysStore();
  const { carryOverMonths, country, region, year, allowPastDays, ptoDays, strategy } = useFiltersStore();
  const { generateSuggestions } = useHolidaysStore();
  const [cleared, setCleared] = useState(false);

  const resetToDefaults = () => {
    resetHolidaysStore();
    setCleared(true);
    fetchHolidays({ country, region, year, locale });
    generateSuggestions({
      year: parseInt(year),
      ptoDays,
      allowPastDays,
      months: getTotalMonths({ carryOverMonths, year }),
      strategy,
    });
  };

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>
        If the app behaves unexpectedly it may be caused by stale local data. When the project evolves some stored
        objects can change shape, causing the client to reuse incompatible structures and fail to revalidate correctly.
        Clearing local storage forces a fresh state.
      </p>
      <div className='flex items-center gap-2'>
        <Button variant='destructive' onClick={resetToDefaults} disabled={cleared} className='m-auto'>
          {cleared ? 'Cleared' : 'Reset Local Storage'}
        </Button>
      </div>
    </div>
  );
};
