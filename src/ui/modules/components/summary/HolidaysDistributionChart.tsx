import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';
import { PieChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PremiumFeature } from '../premium/PremiumFeature';
import { COLOR_SCHEMES } from './const';

interface HolidaysDistributionChartProps {
  ptoDays: number;
  holidays: HolidayDTO[];
}

interface LegendPayload {
  value: string;
  color: string;
}

const HolidaysDistributionChartLegend = ({ payload }: { payload?: readonly LegendPayload[] }) => (
  <ul className='flex flex-row gap-4 justify-center mt-2'>
    {payload?.map((entry) => (
      <li key={entry.value} className='flex items-center gap-2'>
        <span
          className='inline-block w-3 h-3 rounded-sm'
          style={{
            backgroundColor:
              typeof entry.value === 'string' &&
              MODIFIERS_CLASS_NAMES[entry.value as keyof typeof MODIFIERS_CLASS_NAMES]
                ? MODIFIERS_CLASS_NAMES[entry.value as keyof typeof MODIFIERS_CLASS_NAMES]
                : entry.color,
          }}
        />
        <span className='text-sm text-gray-800 dark:text-gray-200'>{entry.value}</span>
      </li>
    ))}
  </ul>
);

export const HolidaysDistributionChart = ({ ptoDays, holidays }: HolidaysDistributionChartProps) => {
  const t = useTranslations('charts');

  const chartData = useMemo(() => {
    const nationalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.NATIONAL).length ?? 0;
    const regionalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL).length ?? 0;
    const customDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.CUSTOM).length ?? 0;

    const data = [
      { name: t('pto'), value: ptoDays, color: COLOR_SCHEMES[0] },
      { name: t('national'), value: nationalDays, color: COLOR_SCHEMES[3] },
      { name: t('regional'), value: regionalDays, color: COLOR_SCHEMES[2] },
      { name: t('custom'), value: customDays, color: COLOR_SCHEMES[1] },
    ].filter((item) => item.value > 0);

    const regionalPart = regionalDays > 0 ? t('regionalPart', { regionalDays }) : '';
    const customPart = customDays > 0 ? t('customPart', { customDays }) : '';
    const description = t('distributionDescription', { ptoDays, nationalDays, regionalPart, customPart });

    return { data, description, nationalDays, regionalDays, customDays };
  }, [ptoDays, holidays, t]);

  return (
    <PremiumFeature
      feature={t('daysOffCompositionFeature')}
      description={chartData.description}
      iconSize='size-7'
      inlineDescription
    >
      <Card className='shadow-md'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <PieChart className='w-5 h-5 text-purple-500' />
            {t('daysOffComposition')}
          </CardTitle>
          <div className='text-xs text-muted-foreground mt-1'>{chartData.description}</div>
        </CardHeader>
        <CardContent className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <RechartsPieChart>
              <Pie data={chartData.data} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={50} outerRadius={85}>
                {chartData.data.map((entry) => (
                  <Cell key={entry.name} fill={MODIFIERS_CLASS_NAMES[entry.name] || entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} ${t('days')}`, name]}
                contentStyle={{
                  backgroundColor: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--primary-foreground)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.5)' }}
                labelStyle={{ color: 'var(--primary-foreground)' }}
                itemStyle={{ color: 'var(--primary-foreground)' }}
              />
              <Legend
                verticalAlign='bottom'
                height={36}
                iconType='circle'
                wrapperStyle={{ fontSize: '14px' }}
                content={(props) => (
                  <HolidaysDistributionChartLegend payload={props.payload as readonly LegendPayload[]} />
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </PremiumFeature>
  );
};
