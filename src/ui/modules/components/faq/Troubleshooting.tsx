'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { toast } from 'sonner';
import { getTotalMonths } from '../utils/helpers';

export const Troubleshooting = () => {
  const locale = useLocale();
  const { resetToDefaults: resetHolidaysStore, fetchHolidays } = useHolidaysStore();
  const { carryOverMonths, country, region, year, allowPastDays, ptoDays, strategy } = useFiltersStore();
  const { generateSuggestions } = useHolidaysStore();
  const [cleared, setCleared] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetToDefaults = () => {
    startTransition(async () => {
      try {
        resetHolidaysStore();

        await fetchHolidays({ country, region, year, locale });

        generateSuggestions({
          year: parseInt(year),
          ptoDays,
          allowPastDays,
          months: getTotalMonths({ carryOverMonths, year }),
          strategy,
        });

        setCleared(true);

        toast.success('Local storage cleared successfully', {
          description: 'All data has been reset and refreshed from the server.',
        });
      } catch (error) {
        console.error('Error resetting to defaults:', error);
        toast.error('Error clearing local storage', {
          description: 'Something went wrong while resetting the data. Please try again.',
        });
      }
    });
  };

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>
        If the app behaves unexpectedly it may be caused by stale local data. When the project evolves some stored
        objects can change shape, causing the client to reuse incompatible structures and fail to revalidate correctly.
        Clearing local storage forces a fresh state.
      </p>
      <Button variant='destructive' onClick={resetToDefaults} disabled={cleared || isPending}>
        {isPending ? 'Clearing...' : cleared ? 'Cleared' : 'Reset Local Storage'}
      </Button>
    </div>
  );
};
