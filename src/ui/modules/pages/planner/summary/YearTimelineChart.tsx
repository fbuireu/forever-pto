'use client';

import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/modules/core/primitives/Card';
import { cn } from '@ui/utils/utils';
import { CalendarRange } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

const DAY_MS = 86_400_000;

interface Seg {
  start: Date;
  end: Date;
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function segPos(date: Date, year: number): number {
  const m = date.getMonth();
  const d = date.getDate();
  return (m + (d - 1) / getDaysInMonth(m, year)) / 12;
}

function segWidth(start: Date, end: Date, year: number): number {
  const em = end.getMonth();
  const ed = end.getDate();
  const endFrac = (em + ed / getDaysInMonth(em, year)) / 12;
  return Math.max(endFrac - segPos(start, year), 0.005);
}

function groupDates(dates: Date[], maxGapDays: number): Seg[] {
  if (!dates.length) return [];
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const out: Seg[] = [];
  let s = sorted[0];
  let e = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i].getTime() - e.getTime()) / DAY_MS <= maxGapDays) {
      e = sorted[i];
    } else {
      out.push({ start: s, end: e });
      s = sorted[i];
      e = sorted[i];
    }
  }
  out.push({ start: s, end: e });
  return out;
}

interface YearTimelineChartProps {
  year: number;
  holidays: HolidayDTO[];
  suggestion: Suggestion | null;
  manuallySelectedDays: Date[];
}

const ROW_COLOR: Record<string, string> = {
  national: 'bg-[var(--color-brand-yellow)]',
  regional: 'bg-[var(--color-brand-yellow)]',
  custom: 'bg-[var(--color-brand-purple)]',
  pto: 'bg-[var(--color-brand-teal)]',
  bridges: 'bg-[var(--color-brand-orange)]',
  manual: 'bg-[color-mix(in_srgb,var(--color-brand-purple)_18%,var(--color-brand-teal)_82%)]',
};

export const YearTimelineChart = ({ year, holidays, suggestion, manuallySelectedDays }: YearTimelineChartProps) => {
  const t = useTranslations('summary');
  const locale = useLocale();

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(year, i, 1).toLocaleDateString(locale, { month: 'short' }).toUpperCase()
      ),
    [year, locale]
  );

  const rows = useMemo(() => {
    const national = holidays
      .filter((h) => h.variant === HolidayVariant.NATIONAL)
      .map((h) => ({ start: h.date, end: h.date }));

    const regional = holidays
      .filter((h) => h.variant === HolidayVariant.REGIONAL)
      .map((h) => ({ start: h.date, end: h.date }));

    const custom = holidays
      .filter((h) => h.variant === HolidayVariant.CUSTOM)
      .map((h) => ({ start: h.date, end: h.date }));

    const pto = groupDates(suggestion?.days ?? [], 3);

    const bridges = (suggestion?.bridges ?? []).map((b) => ({
      start: b.startDate,
      end: b.endDate,
    }));

    const manual = manuallySelectedDays.map((d) => ({ start: d, end: d }));

    return [
      { key: 'national', label: t('yearTimeline.rows.national'), segs: national },
      { key: 'regional', label: t('yearTimeline.rows.regional'), segs: regional },
      { key: 'custom', label: t('yearTimeline.rows.custom'), segs: custom },
      { key: 'pto', label: t('yearTimeline.rows.pto'), segs: pto },
      { key: 'bridges', label: t('yearTimeline.rows.bridges'), segs: bridges },
      { key: 'manual', label: t('yearTimeline.rows.manual'), segs: manual },
    ].filter((row) => row.segs.length > 0);
  }, [holidays, suggestion, manuallySelectedDays, t]);

  return (
    <Card className='shadow-[var(--shadow-brutal-md)] [contain:layout]'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base font-display font-semibold'>
          <CalendarRange className='w-5 h-5 text-muted-foreground' />
          {t('yearTimeline.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 pb-4'>
        <div className='rounded-[10px] border-[3px] border-[var(--frame)] overflow-hidden'>
          <div className='flex bg-card dark:bg-[var(--color-brand-ink)] border-b-[2px] border-[var(--frame)]/30'>
            <div className='w-[72px] shrink-0 border-r-[2px] border-[var(--frame)]/30' />
            {monthNames.map((name, i) => (
              <div
                key={name}
                className={cn(
                  'flex-1 text-center py-2 text-[9px] font-mono font-black tracking-[0.08em] text-foreground dark:text-[var(--accent)]',
                  i < 11 && 'border-r-[1px] border-[var(--frame)]/20'
                )}
              >
                {name}
              </div>
            ))}
          </div>

          {rows.map(({ key, label, segs }, rowIdx) => (
            <div
              key={key}
              className={cn(
                'flex items-center h-9 bg-card dark:bg-[var(--color-brand-ink)]',
                rowIdx < rows.length - 1 && 'border-b-[1px] border-[var(--frame)]/15'
              )}
            >
              <div className='w-[72px] shrink-0 px-2.5 border-r-[2px] border-[var(--frame)]/30 h-full flex items-center'>
                <span className='text-[8px] font-mono font-black uppercase tracking-[0.1em] text-muted-foreground leading-none'>
                  {label}
                </span>
              </div>

              <div className='flex-1 flex items-center px-2 py-1.5'>
                <div className='relative flex-1 h-[18px] rounded-full border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] overflow-hidden'>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((month) => (
                    <div
                      key={month}
                      className='absolute inset-y-0 w-px bg-[var(--frame)]/10 z-10'
                      style={{ left: `${(month / 12) * 100}%` }}
                    />
                  ))}
                  {segs.map((seg) => (
                    <div
                      key={seg.start.toISOString()}
                      className={cn('absolute inset-y-0 border-r-[3px] border-[var(--frame)]', ROW_COLOR[key])}
                      style={{
                        left: `${segPos(seg.start, year) * 100}%`,
                        width: `max(6px, ${segWidth(seg.start, seg.end, year) * 100}%)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
