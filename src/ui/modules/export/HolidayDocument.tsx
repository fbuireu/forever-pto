import type { HolidayDTO } from '@application/dto/holiday/types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const C = {
  orange: '#f97316',
  teal: '#2dd4bf',
  ink: '#0e0e0e',
  paper: '#fafaf7',
  muted: '#71717a',
  border: '#d4d4d8',
} as const;

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.paper,
    padding: 40,
    paddingBottom: 70,
    color: C.ink,
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: C.ink,
    borderBottomStyle: 'solid',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.4,
  },
  headerYear: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.orange,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  badge: {
    marginLeft: 8,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: C.ink,
    color: C.paper,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 3,
  },
  badgeTeal: {
    marginLeft: 8,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: C.teal,
    color: C.ink,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 3,
  },
  monthGroup: {
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: C.muted,
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderLeftWidth: 2,
    borderLeftColor: C.border,
    borderLeftStyle: 'solid',
    marginBottom: 2,
  },
  rowDate: {
    fontSize: 8,
    color: C.muted,
    width: 100,
  },
  rowName: {
    fontSize: 8,
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
    marginTop: 12,
    marginBottom: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
});

const fmtDayCache = new Map<string, Intl.DateTimeFormat>();
const fmtMonthCache = new Map<string, Intl.DateTimeFormat>();
const fmtDateCache = new Map<string, Intl.DateTimeFormat>();

function fmtDay(date: Date, locale: string): string {
  let fmt = fmtDayCache.get(locale);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    fmtDayCache.set(locale, fmt);
  }
  return fmt.format(date);
}

function fmtMonth(date: Date, locale: string): string {
  let fmt = fmtMonthCache.get(locale);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    fmtMonthCache.set(locale, fmt);
  }
  return fmt.format(date);
}

function fmtDate(date: Date, locale: string): string {
  let fmt = fmtDateCache.get(locale);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    fmtDateCache.set(locale, fmt);
  }
  return fmt.format(date);
}

function groupByMonth<T>(items: T[], getDate: (item: T) => Date, locale: string): Array<{ month: string; items: T[] }> {
  const map = new Map<string, { month: string; items: T[] }>();

  for (const item of items) {
    const d = getDate(item);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, { month: fmtMonth(d, locale), items: [] });
    map.get(key)?.items.push(item);
  }

  return [...map.entries()].toSorted(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
}

interface PdfLabels {
  holidays: string;
  vacationDays: string;
  dayOff: string;
  generatedOn: string;
}

export interface HolidayDocumentProps {
  year: number;
  holidays: HolidayDTO[];
  ptoDays: Date[];
  includeHolidays: boolean;
  includePto: boolean;
  locale: string;
  labels: PdfLabels;
}

export function HolidayDocument({
  year,
  holidays,
  ptoDays,
  includeHolidays,
  includePto,
  locale,
  labels,
}: HolidayDocumentProps) {
  const holidayGroups = includeHolidays ? groupByMonth(holidays, (h) => h.date, locale) : [];
  const ptoGroups = includePto ? groupByMonth(ptoDays, (d) => d, locale) : [];
  const today = new Date();

  return (
    <Document title={`Forever PTO ${year}`} author='forever-pto.com'>
      <Page size='A4' style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Forever PTO</Text>
          <Text style={s.headerYear}>{year}</Text>
        </View>

        {includeHolidays && holidayGroups.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{labels.holidays}</Text>
              <Text style={s.badge}>{holidays.length}</Text>
            </View>
            {holidayGroups.map((group) => (
              <View key={group.month} style={s.monthGroup}>
                <Text style={s.monthLabel}>{group.month}</Text>
                {group.items.map((h) => (
                  <View key={h.id} style={s.row}>
                    <Text style={s.rowDate}>{fmtDay(h.date, locale)}</Text>
                    <Text style={s.rowName}>{h.name}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {includeHolidays && includePto && ptoGroups.length > 0 && <View style={s.divider} />}

        {includePto && ptoGroups.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{labels.vacationDays}</Text>
              <Text style={s.badgeTeal}>{ptoDays.length}</Text>
            </View>
            {ptoGroups.map((group) => (
              <View key={group.month} style={s.monthGroup}>
                <Text style={s.monthLabel}>{group.month}</Text>
                {group.items.map((d) => (
                  <View key={d.toISOString()} style={s.row}>
                    <Text style={s.rowDate}>{fmtDay(d, locale)}</Text>
                    <Text style={s.rowName}>{labels.dayOff}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>forever-pto.com</Text>
          <Text style={s.footerText}>
            {labels.generatedOn} {fmtDate(today, locale)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
