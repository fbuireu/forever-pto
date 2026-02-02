import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PremiumFeature } from '../premium/PremiumFeature';
import { COLOR_SCHEMES } from './const';
import { getMonthNames } from '../utils/helpers';

interface MonthlyDistributionChartProps {
  monthlyDist: number[];
  year: number;
  carryOverMonths: number;
}

export const MonthlyDistributionChart = ({ monthlyDist, year, carryOverMonths }: MonthlyDistributionChartProps) => {
  const locale = useLocale();
  const t = useTranslations('charts');
  const { monthNames, timelineData } = useMemo(() => {
    const totalMonths = 12 + carryOverMonths;
    const names = getMonthNames({ locale, monthCount: totalMonths, startYear: year });
    const paddedMonthlyDist = [...monthlyDist, ...Array(Math.max(0, totalMonths - monthlyDist.length)).fill(0)];
    const data = paddedMonthlyDist.map((value, index) => ({
      mes: names[index] || `Month ${index + 1}`,
      days: value,
    }));
    return { monthNames: names, timelineData: data };
  }, [locale, carryOverMonths, year, monthlyDist]);

  const totalDays = monthlyDist.reduce((sum, days) => sum + days, 0);
  const activeMonths = monthlyDist.filter((days) => days > 0).length;
  const peakMonthIndex = monthlyDist.indexOf(Math.max(...monthlyDist));
  const peakMonth = monthNames[peakMonthIndex];
  const peakDays = Math.max(...monthlyDist);

  const description = t('timelineDescription', { totalDays, activeMonths, peakMonth, peakDays });

  return (
    <PremiumFeature feature={t('annualTimelineFeature')} description={description} iconSize='size-7' inlineDescription>
      <Card className='shadow-md'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <TrendingUp className='w-5 h-5 text-green-500' />
            {t('annualTimeline')}
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
                type={'monotone'}
                dataKey='days'
                stroke={COLOR_SCHEMES[3]}
                fill={COLOR_SCHEMES[3]}
                fillOpacity={0.3}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6, stroke: COLOR_SCHEMES[3], strokeWidth: 2 }}
              />
              <Tooltip
                formatter={(value) => [`${value} ${t('days')}`, t('daysOffLabel')]}
                contentStyle={{
                  backgroundColor: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--primary-foreground)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ color: 'var(--primary-foreground)' }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.5)' }}
                labelStyle={{ color: 'var(--primary-foreground)' }}
                labelFormatter={(label) => {
                  const date = new Date(year, monthNames.indexOf(label), 1);
                  return date.toLocaleDateString(locale, {
                    month: 'long',
                    year: 'numeric',
                  });
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </PremiumFeature>
  );
};
