'use client';

import { useFiltersStore } from '@application/stores/filters';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';

export const SiteTitleYear = () => {
  const year = useFiltersStore((state) => state.year);

  return <SlidingNumber number={year} className='font-serif font-normal text-[1.1em] text-muted-foreground' />;
};
