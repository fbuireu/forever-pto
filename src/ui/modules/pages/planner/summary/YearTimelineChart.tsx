'use client';

import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { cn } from '@ui/utils/cn';
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
  const sorted = dates.toSorted((a, b) => a.getTime() - b.getTime());
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
  custom: 'bg-[color-mix(in_srgb,var(--color-brand-purple)_28%,white_72%)]',
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
    const national: Seg[] = [];
    const regional: Seg[] = [];
    const custom: Seg[] = [];
    for (const h of holidays) {
      const seg = { start: h.date, end: h.date };
      if (h.variant === HolidayVariant.NATIONAL) national.push(seg);
      else if (h.variant === HolidayVariant.REGIONAL) regional.push(seg);
      else if (h.variant === HolidayVariant.CUSTOM) custom.push(seg);
    }

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
    <div className='w-full border-[3px] border-[var(--frame)] rounded-[10px] shadow-[4px_4px_0_0_var(--frame)] overflow-hidden bg-card'>
      <div className='flex gap-2.5 px-3 border-b-[3px] border-[var(--frame)]'>
        <div className='w-[70px] shrink-0' />
        <div className='flex-1 grid grid-cols-12'>
          {monthNames.map((name, i) => (
            <div
              key={name}
              className={cn(
                'py-2 px-1 text-center text-[11px] font-mono font-bold tracking-[0.05em]',
                i < 11 && 'border-r-[2px] border-[var(--frame)]'
              )}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      <div className='p-3 flex flex-col gap-2'>
        {rows.map(({ key, label, segs }) => (
          <div key={key} className='flex items-center gap-2.5'>
            <div className='w-[70px] shrink-0 overflow-hidden text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-muted-foreground leading-none'>
              {label}
            </div>
            <div className='flex-1 h-4 bg-[var(--surface-panel)] border-[3px] border-[var(--frame)] rounded-full relative overflow-hidden'>
              {segs.map((seg) => (
                <div
                  key={seg.start.toISOString()}
                  className={cn('absolute inset-y-0 rounded-full border-[2px] border-[var(--frame)]', ROW_COLOR[key])}
                  style={{
                    left: `${segPos(seg.start, year) * 100}%`,
                    width: `max(8px, ${segWidth(seg.start, seg.end, year) * 100}%)`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
