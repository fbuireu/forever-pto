import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';
import { Calendar } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PremiumFeature } from '../premium/PremiumFeature';
import { COLOR_SCHEMES } from './const';

interface BlockPerQuarterChartProps {
  blocksPerQuarter: number[];
}

export const BlocksPerQuarterChart = ({ blocksPerQuarter }: BlockPerQuarterChartProps) => {
  const data = blocksPerQuarter.map((value, index) => ({
    name: `Q${index + 1}`,
    bloques: value,
    color: COLOR_SCHEMES[blocksPerQuarter.length - index - 1],
  }));

  const totalBlocks = blocksPerQuarter.reduce((sum, blocks) => sum + blocks, 0);
  const bestQuarterIndex = blocksPerQuarter.indexOf(Math.max(...blocksPerQuarter));
  const bestQuarter = bestQuarterIndex + 1;
  const maxBlocks = Math.max(...blocksPerQuarter);
  const description = `${totalBlocks} bloques largos (3+ días consecutivos) ideales para vacaciones${totalBlocks > 0 ? `. Mejor trimestre: Q${bestQuarter} con ${maxBlocks} bloque${maxBlocks !== 1 ? 's' : ''}` : ''}.`;

  return (
    <PremiumFeature
      feature={'Gráfica de Bloques Largos por Trimestre'}
      description={description}
      iconSize='h12 w-12'
      inlineDescription
    >
      <Card className='shadow-md'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Calendar className='w-5 h-5 text-cyan-500' />
            Bloques Largos por Trimestre
          </CardTitle>
          <div className='text-xs text-muted-foreground mt-1'>{description}</div>
        </CardHeader>
        <CardContent className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#d1d5db' opacity={0.8} />
              <XAxis dataKey='name' axisLine={false} tickLine={false} fontSize={14} />
              <YAxis axisLine={false} tickLine={false} fontSize={14} allowDecimals={false} />
              <Bar dataKey='bloques' radius={[6, 6, 0, 0]} maxBarSize={60} cursor={''}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={MODIFIERS_CLASS_NAMES[entry.name] || entry.color} />
                ))}
              </Bar>
              <Tooltip
                formatter={(value) => [`${value} bloque${value !== 1 ? 's' : ''}`, 'Bloques de 3+ días']}
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
