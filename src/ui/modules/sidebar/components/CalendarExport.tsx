'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { Button } from '@ui/modules/core/animate/components/buttons/Button';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { downloadIcs, generateIcs } from '@ui/utils/generateIcs';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const CalendarExport = () => {
  const t = useTranslations('calendarExport');
  const [includeHolidays, setIncludeHolidays] = useState(true);
  const [includePto, setIncludePto] = useState(true);

  const { year } = useFiltersStore(useShallow((s) => ({ year: s.year })));
  const { holidays, suggestion, currentSelection } = useHolidaysStore(
    useShallow((s) => ({
      holidays: s.holidays,
      suggestion: s.suggestion,
      currentSelection: s.currentSelection,
    }))
  );

  const activeSuggestion = currentSelection ?? suggestion;
  const hasData =
    (includeHolidays && (holidays?.length ?? 0) > 0) || (includePto && !!activeSuggestion?.days?.length);

  const handleDownload = () => {
    const content = generateIcs({
      year: Number(year),
      calendarName: t('calendarName'),
      ptoDayLabel: t('ptoDayLabel'),
      holidays: holidays ?? [],
      suggestion: activeSuggestion,
      includeHolidays,
      includePto,
    });
    downloadIcs(content, `forever-pto-${year}.ics`);
  };

  return (
    <div className='space-y-3 w-full' data-tutorial='calendar-export'>
      <div className='flex gap-2 my-2 text-sm font-normal'>
        <Download size={16} /> {t('title')}
      </div>
      <p className='text-xs text-muted-foreground'>{t('description')}</p>
      <div className='flex gap-2'>
        <Button
          type='button'
          size='sm'
          variant={includeHolidays ? 'default' : 'outline'}
          onClick={() => setIncludeHolidays((v) => !v)}
          className='flex-1 text-[11px]'
        >
          {t('includeHolidays')}
        </Button>
        <Button
          type='button'
          size='sm'
          variant={includePto ? 'default' : 'outline'}
          onClick={() => setIncludePto((v) => !v)}
          className='flex-1 text-[11px]'
        >
          {t('includePto')}
        </Button>
      </div>
      <AnimateIcon animateOnHover>
        <Button onClick={handleDownload} disabled={!hasData} className='w-full' variant='outline'>
          <Download className='w-3 h-3' />
          {t('download')}
        </Button>
      </AnimateIcon>
      <p className='text-[10px] text-muted-foreground leading-relaxed'>{t('compatible')}</p>
    </div>
  );
};
