'use client';

import { useFiltersState } from '@application/stores/filters';
import { Badge } from '@const/components/ui/badge';
import { Card, CardDescription } from '@const/components/ui/card';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { FilterStrategy } from '@infrastructure/services/calendar/types';
import { AlertCircle, CheckCircle2, DicesIcon } from 'lucide-react';

const STRATEGIES = [
  {
    value: FilterStrategy.GROUPED,
    label: 'Grouped',
    emoji: '🏖️',
    description: 'Prioriza vacaciones largas y continuas',
    subtitle: 'Agrupa días puentes con festivos consecutivos',
    pros: ['Simula la selección humana', 'Puentes largos'],
    cons: ['Menos días totales', 'Menor eficiencia'],
  },
  {
    value: FilterStrategy.OPTIMIZED,
    label: 'Optimized',
    emoji: '📈',
    description: 'Maximiza eficiencia de días PTO',
    subtitle: 'Obtén la mayor cantidad de días libres',
    pros: ['Máximo rendimiento', 'Más días totales'],
    cons: ['Puentes cortos', 'Días dispersos'],
  },
  {
    value: FilterStrategy.BALANCED,
    label: 'Balanced',
    emoji: '⚖️',
    description: 'Equilibrio inteligente',
    subtitle: 'Combina eficiencia con agrupación',
    pros: ['Flexible', 'Períodos medianos', 'Versátil'],
    cons: ['No maximiza', 'Solución intermedia'],
  },
];

export const Strategy = () => {
  const { setStrategy, strategy } = useFiltersState();
  const currentStrategy = STRATEGIES.find(({ value }) => value === strategy);

  return (
    <Field className='space-y-3 w-full'>
      <Label className='flex gap-2 text-sm font-medium' htmlFor='strategy'>
        <DicesIcon size={16} /> Strategy
      </Label>
      <Combobox
        className='w-full'
        id='strategy'
        options={STRATEGIES}
        value={strategy}
        onChange={setStrategy}
        disabled={!STRATEGIES.length}
        placeholder={'Select strategy...'}
        searchPlaceholder='Search strategies...'
      />

      {currentStrategy && (
        <Card className='p-4 bg-muted/50'>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <span className='text-2xl'>{currentStrategy.emoji}</span>
              <div className='flex-1'>
                <h4 className='font-semibold text-sm'>{currentStrategy.description}</h4>
                <CardDescription className='text-xs'>{currentStrategy.subtitle}</CardDescription>
              </div>
            </div>

            <div className='grid gap-2'>
              <div className='flex flex-wrap gap-1.5'>
                {currentStrategy.pros.map((pro) => (
                  <Badge key={pro} variant='outline' className='text-xs border-green-500/30 bg-green-500/10'>
                    <CheckCircle2 className='w-3 h-3 mr-1' />
                    {pro}
                  </Badge>
                ))}
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {currentStrategy.cons.map((con) => (
                  <Badge key={con} variant='outline' className='text-xs border-orange-500/30 bg-orange-500/10'>
                    <AlertCircle className='w-3 h-3 mr-1' />
                    {con}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </Field>
  );
};
