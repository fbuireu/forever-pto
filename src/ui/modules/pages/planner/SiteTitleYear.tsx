'use client';

import { useFiltersStore } from '@application/stores/filters';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';

export const SiteTitleYear = () => {
  const year = useFiltersStore((state) => state.year);

  return (
    <SlidingNumber
      number={Number(year)}
      className='font-serif font-normal text-[0.7em] text-muted-foreground'
    />
  );
};
