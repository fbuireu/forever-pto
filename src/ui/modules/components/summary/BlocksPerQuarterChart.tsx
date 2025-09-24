import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';
import { Calendar } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BlockPerQuarterChartProps {
  blocksPerQuarter: number[];
}

const QUARTER_COLORS = ['#06b6d4', '#8b5cf6', '#f97316', '#84cc16'];

interface LegendPayload {
  value: string;
  color: string;
}

const BlocksPerQuarterChartLegend = ({ payload }: { payload?: readonly LegendPayload[] }) => (
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

export const BlocksPerQuarterChart = ({ blocksPerQuarter }: BlockPerQuarterChartProps) => {
  const longBlocksData = blocksPerQuarter.map((value, index) => ({
    name: `Q${index + 1}`,
    bloques: value,
    color: QUARTER_COLORS[index],
  }));

  const totalBlocks = blocksPerQuarter.reduce((sum, blocks) => sum + blocks, 0);
  const bestQuarterIndex = blocksPerQuarter.indexOf(Math.max(...blocksPerQuarter));
  const bestQuarter = bestQuarterIndex + 1;
  const maxBlocks = Math.max(...blocksPerQuarter);

  const description = `${totalBlocks} bloques largos (3+ días consecutivos) ideales para vacaciones${totalBlocks > 0 ? `. Mejor trimestre: Q${bestQuarter} con ${maxBlocks} bloque${maxBlocks !== 1 ? 's' : ''}` : ''}.`;

  return (
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
          <BarChart data={longBlocksData} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#d1d5db' opacity={0.8} />
            <XAxis dataKey='name' axisLine={false} tickLine={false} fontSize={14} />
            <YAxis axisLine={false} tickLine={false} fontSize={14} allowDecimals={false} />
            <Bar dataKey='bloques' radius={[6, 6, 0, 0]} maxBarSize={60} cursor={''}>
              {longBlocksData.map((entry) => (
                <Cell key={entry.name} fill={MODIFIERS_CLASS_NAMES[entry.name] || entry.color} />
              ))}
            </Bar>
            <Tooltip
              formatter={(value) => [`${value} bloque${value !== 1 ? 's' : ''}`, 'Bloques de 3+ días']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#222',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.5)' }}
              labelStyle={{ color: '#222' }}
            />
            <Legend
              verticalAlign='bottom'
              height={20}
              iconType='rect'
              wrapperStyle={{ fontSize: '14px' }}
              content={(props) => (
                <BlocksPerQuarterChartLegend payload={props.payload as readonly LegendPayload[]} />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
