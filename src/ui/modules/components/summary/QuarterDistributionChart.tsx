import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PremiumFeature } from '../premium/PremiumFeature';
import { COLOR_SCHEMES } from './const';

interface QuarterDistributionChartChartProps {
  quarterDist: number[];
}

export const QuarterDistributionChart = ({ quarterDist }: QuarterDistributionChartChartProps) => {
  const data = quarterDist.map((value, index) => ({
    name: `Q${index + 1}`,
    días: value,
    color: COLOR_SCHEMES[index],
  }));

  const totalDays = quarterDist.reduce((sum, days) => sum + days, 0);
  const activeQuarters = quarterDist.filter((days) => days > 0).length;
  const description = `Distribución de ${totalDays} días libres efectivos a lo largo de ${activeQuarters} trimestre${activeQuarters !== 1 ? 's' : ''} del año.`;

  return (
    <PremiumFeature
      feature={'Gráfica de Distribución por Trimestre'}
      description={description}
      iconSize='h12 w-12'
      inlineDescription
    >
      <Card className='shadow-md'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <BarChart3 className='w-5 h-5 text-blue-500' />
            Distribución por Trimestre
          </CardTitle>
          <div className='text-xs text-muted-foreground mt-1'>{description}</div>
        </CardHeader>
        <CardContent className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#d1d5db' opacity={0.8} />
              <XAxis dataKey='name' axisLine={false} tickLine={false} fontSize={14} />
              <YAxis axisLine={false} tickLine={false} fontSize={14} allowDecimals={false} />
              <Bar dataKey='días' radius={[6, 6, 0, 0]} maxBarSize={60}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={MODIFIERS_CLASS_NAMES[entry.name] || entry.color} />
                ))}
              </Bar>
              <Tooltip
                formatter={(value) => [`${value} días`, 'Días libres']}
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
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </PremiumFeature>
  );
};
