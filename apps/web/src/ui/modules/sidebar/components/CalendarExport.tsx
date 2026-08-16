'use client';

import { holidaysInPlanningWindow } from '@application/dto/holiday/dto';
import { generateIcs } from '@application/export/generateIcs';
import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { usePlanReadout } from '@ui/hooks/usePlanReadout';
import { Button } from '@ui/modules/core/primitives/Button';
import type { HolidayDocumentProps } from '@ui/modules/export/HolidayDocument';
import { PremiumFeature } from '@ui/modules/premium/PremiumFeature';
import { SidebarFieldTooltip } from '@ui/modules/sidebar/components/SidebarFieldLabel';
import { Effect } from 'effect';
import { Download, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

interface PdfExportParams extends HolidayDocumentProps {
  filename: string;
}

function makeObjectUrl(blob: Blob) {
  return Effect.acquireRelease(
    Effect.sync(() => URL.createObjectURL(blob)),
    (url) => Effect.sync(() => URL.revokeObjectURL(url))
  );
}

function pdfExportEffect({ filename, ...docProps }: PdfExportParams) {
  return Effect.gen(function* () {
    const [renderer, { HolidayDocument }] = yield* Effect.tryPromise(() =>
      Promise.all([import('@react-pdf/renderer'), import('@ui/modules/export/HolidayDocument')])
    );
    const blob = yield* Effect.tryPromise(() => renderer.pdf(<HolidayDocument {...docProps} />).toBlob());
    const url = yield* makeObjectUrl(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }).pipe(Effect.scoped);
}

function BoldText(chunks: ReactNode) {
  return <strong className='font-black text-foreground'>{chunks}</strong>;
}

export const CalendarExport = () => {
  const t = useTranslations('calendarExport');
  const locale = useLocale();
  const [includeHolidays, setIncludeHolidays] = useState(true);
  const [includePto, setIncludePto] = useState(true);
  const [isPdfPending, startPdfTransition] = useTransition();

  const { year, country, region } = useFiltersStore(
    useShallow((s) => ({ year: s.year, country: s.country, region: s.region }))
  );
  const holidays = useHolidaysStore((s) => s.holidays);

  const { placedDays: ptoDays } = usePlanReadout();
  const holidaysInWindow = useMemo(() => holidaysInPlanningWindow(holidays), [holidays]);
  const hasData = (includeHolidays && holidaysInWindow.length > 0) || (includePto && ptoDays.length > 0);

  const handleDownloadIcs = () => {
    const content = generateIcs({
      year,
      calendarName: t('calendarName'),
      ptoDayLabel: t('ptoDayLabel'),
      holidays: holidaysInWindow,
      ptoDays,
      includeHolidays,
      includePto,
      country,
      region,
    });
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forever-pto-${year}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    startPdfTransition(async () => {
      try {
        await Effect.runPromise(
          pdfExportEffect({
            year,
            holidays: includeHolidays ? holidaysInWindow : [],
            ptoDays: includePto ? ptoDays : [],
            includeHolidays,
            includePto,
            locale,
            labels: {
              holidays: t('pdf.holidays'),
              ptoDays: t('pdf.ptoDays'),
              ptoDay: t('pdf.ptoDay'),
              generatedOn: t('pdf.generatedOn'),
            },
            filename: `forever-pto-${year}.pdf`,
          })
        );
        toast.success(t('pdf.successTitle'), { description: t('pdf.successDescription') });
      } catch {
        toast.error(t('pdf.errorTitle'), { description: t('pdf.errorDescription') });
      }
    });
  };

  return (
    <div className='space-y-3 w-full'>
      <div className='flex gap-2 my-2 text-sm font-normal'>
        <Download size={16} /> {t('title')}
      </div>
      <p className='text-xs text-muted-foreground'>
        {t.rich('description', {
          count: holidaysInWindow.length,
          b: BoldText,
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
        <SidebarFieldTooltip label={t('tooltipLabel')}>{t('tooltip')}</SidebarFieldTooltip>
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
