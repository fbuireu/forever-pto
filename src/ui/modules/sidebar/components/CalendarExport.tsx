'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { downloadIcs, generateIcs } from '@infrastructure/services/export/generateIcs';
import { Tooltip, TooltipContent, TooltipInfoTrigger, TooltipProvider } from '@ui/modules/core/animate/base/Tooltip';
import { Button } from '@ui/modules/core/primitives/Button';
import { PremiumFeature } from '@ui/modules/premium/PremiumFeature';
import { Download, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

export const CalendarExport = () => {
  const t = useTranslations('calendarExport');
  const locale = useLocale();
  const [includeHolidays, setIncludeHolidays] = useState(true);
  const [includePto, setIncludePto] = useState(true);
  const [isPdfPending, startPdfTransition] = useTransition();

  const { year } = useFiltersStore(useShallow((s) => ({ year: s.year })));
  const { holidays, suggestion, currentSelection } = useHolidaysStore(
    useShallow((s) => ({
      holidays: s.holidays,
      suggestion: s.suggestion,
      currentSelection: s.currentSelection,
    }))
  );

  const activeSuggestion = currentSelection ?? suggestion;
  const ptoDays = activeSuggestion?.days ?? [];
  const hasData = (includeHolidays && (holidays?.length ?? 0) > 0) || (includePto && ptoDays.length > 0);

  const handleDownloadIcs = () => {
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

  const handleDownloadPdf = () => {
    startPdfTransition(async () => {
      try {
        const [renderer, { HolidayDocument }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@ui/modules/export/HolidayDocument'),
        ]);
        const props = {
          year: Number(year),
          holidays: includeHolidays ? (holidays ?? []) : [],
          ptoDays: includePto ? ptoDays : [],
          includeHolidays,
          includePto,
          locale,
          labels: {
            holidays: t('pdf.holidays'),
            vacationDays: t('pdf.vacationDays'),
            dayOff: t('pdf.dayOff'),
            generatedOn: t('pdf.generatedOn'),
          },
        };
        const blob = await renderer.pdf(<HolidayDocument {...props} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forever-pto-${year}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t('pdf.successTitle'), { description: t('pdf.successDescription') });
      } catch {
        toast.error(t('pdf.errorTitle'), { description: t('pdf.errorDescription') });
      }
    });
  };

  return (
    <div className='space-y-3 w-full' data-tutorial='calendar-export'>
      <div className='flex gap-2 my-2 text-sm font-normal'>
        <Download size={16} /> {t('title')}
      </div>
      <p className='text-xs text-muted-foreground'>
        {t.rich('description', {
          count: holidays?.length ?? 0,
          b: (chunks) => <strong className='font-black text-foreground'>{chunks}</strong>,
        })}
      </p>
      <div className='flex gap-2 items-center'>
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
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipInfoTrigger aria-label={t('tooltipLabel')} />
            <TooltipContent className='w-50 text-pretty'>{t('tooltip')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <PremiumFeature feature={t('title')}>
        <div className='flex flex-col gap-2'>
          <Button onClick={handleDownloadPdf} disabled={!hasData || isPdfPending} className='w-full' variant='outline'>
            <FileText className='size-3' />
            {isPdfPending ? t('downloadingPdf') : t('downloadPdf')}
          </Button>
          <Button onClick={handleDownloadIcs} disabled={!hasData} className='w-full' variant='outline'>
            <Download className='size-3' />
            {t('download')}
          </Button>
        </div>
      </PremiumFeature>
      <p className='text-[10px] text-muted-foreground leading-relaxed'>{t('compatible')}</p>
    </div>
  );
};
