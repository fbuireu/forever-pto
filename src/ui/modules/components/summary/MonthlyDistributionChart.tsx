import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';
import { TrendingUp } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MonthlyDistributionChartProps {
  monthlyDist: number[];
  year: number;
  carryOverMonths: number;
}

interface LegendPayload {
  value: string;
  color: string;
}

const MonthlyDistributionChartLegend = ({ payload }: { payload?: readonly LegendPayload[] }) => (
  <ul className='flex flex-row gap-4 justify-center mt-2'>
    {payload?.map((entry) => (
      <li key={entry.value} className='flex items-center gap-2'>
        <span
          className='inline-block w-3 h-3 rounded-sm'
          style={{
            backgroundColor:
              typeof entry.value === 'string' && MODIFIERS_CLASS_NAMES[entry.value]
                ? MODIFIERS_CLASS_NAMES[entry.value]
                : entry.color,
          }}
        />
        <span className='text-sm text-gray-800 dark:text-gray-200'>{entry.value}</span>
      </li>
    ))}
  </ul>
);

const getMonthNames = (locale: string, monthCount: number, startYear: number): string[] => {
  const monthNames: string[] = [];
  for (let i = 0; i < monthCount; i++) {
    const year = startYear + Math.floor(i / 12);
    const month = i % 12;
    const date = new Date(year, month, 1);

    const monthName = date.toLocaleDateString(locale, { month: 'short' });
    const yearSuffix = i >= 12 ? ` '${year.toString().slice(-2)}` : '';

    monthNames.push(`${monthName}${yearSuffix}`);
  }

  return monthNames;
};

export const MonthlyDistributionChart = ({ monthlyDist, year, carryOverMonths }: MonthlyDistributionChartProps) => {
  const locale = useLocale();
  const { monthNames, timelineData } = useMemo(() => {
    const totalMonths = 12 + carryOverMonths;
    const names = getMonthNames(locale, totalMonths, year);
    const paddedMonthlyDist = [...monthlyDist, ...Array(Math.max(0, totalMonths - monthlyDist.length)).fill(0)];
    const data = paddedMonthlyDist.map((value, index) => ({
      mes: names[index] || `Month ${index + 1}`,
      días: value,
    }));
    return { monthNames: names, timelineData: data };
  }, [locale, carryOverMonths, year, monthlyDist]);

  const totalDays = monthlyDist.reduce((sum, days) => sum + days, 0);
  const activeMonths = monthlyDist.filter((days) => days > 0).length;
  const peakMonthIndex = monthlyDist.indexOf(Math.max(...monthlyDist));
  const peakMonth = monthNames[peakMonthIndex];
  const peakDays = Math.max(...monthlyDist);

  const description = `Evolución mensual de ${totalDays} días libres distribuidos en ${activeMonths} meses. Pico en ${peakMonth} con ${peakDays} días.`;

  return (
    <Card className='shadow-md'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <TrendingUp className='w-5 h-5 text-green-500' />
          Timeline Anual
        </CardTitle>
        <div className='text-xs text-muted-foreground mt-1'>{description}</div>
      </CardHeader>
      <CardContent className='h-64'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={timelineData} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#d1d5db' opacity={0.8} />
            <XAxis dataKey='mes' axisLine={false} tickLine={false} fontSize={14} />
            <YAxis axisLine={false} tickLine={false} fontSize={14} allowDecimals={false} />
            <Area
              type='monotone'
              dataKey='días'
              stroke={MODIFIERS_CLASS_NAMES['Timeline'] || '#10b981'}
              fill={MODIFIERS_CLASS_NAMES['Timeline'] || '#10b981'}
              fillOpacity={0.3}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: MODIFIERS_CLASS_NAMES['Timeline'] || '#10b981', strokeWidth: 2 }}
            />
            <Tooltip
              formatter={(value) => [`${value} días`, 'Días libres']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#222',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ color: '#222' }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.5)' }}
              labelStyle={{ color: '#222' }}
            />
            <Legend
              verticalAlign='bottom'
              height={20}
              iconType='line'
              wrapperStyle={{ fontSize: '14px' }}
              content={(props) => (
                <MonthlyDistributionChartLegend payload={props.payload as readonly LegendPayload[]} />
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
