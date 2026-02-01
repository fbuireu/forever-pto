'use client';

import { useFiltersStore } from '@ui/store/filters';
import { Badge } from '@const/components/ui/badge';
import { Card, CardDescription } from '@const/components/ui/card';
import { Combobox } from '@const/components/ui/combobox';
import { cn } from '@const/lib/utils';
import { FilterStrategy } from '@domain/calendar/models/types';
import { Field, Label } from '@headlessui/react';
import { AlertCircle, CheckCircle2, DicesIcon, Scale, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { ChevronDown } from 'src/components/animate-ui/icons/chevron-down';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { Users } from 'src/components/animate-ui/icons/users';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { useShallow } from 'zustand/react/shallow';

const STRATEGIES = [
  {
    value: FilterStrategy.GROUPED,
    label: 'Grouped',
    icon: Users,
    description: 'Prioriza vacaciones largas y continuas',
    subtitle: 'Agrupa días puentes con festivos consecutivos',
    pros: ['Simula la selección humana', 'Puentes largos'],
    cons: ['Menos días totales', 'Menor eficiencia'],
  },
  {
    value: FilterStrategy.OPTIMIZED,
    label: 'Optimized',
    icon: TrendingUp,
    description: 'Maximiza eficiencia de días PTO',
    subtitle: 'Obtén la mayor cantidad de días libres',
    pros: ['Máximo rendimiento', 'Más días totales'],
    cons: ['Puentes cortos', 'Días dispersos'],
  },
  {
    value: FilterStrategy.BALANCED,
    label: 'Balanced',
    icon: Scale,
    description: 'Equilibrio inteligente',
    subtitle: 'Combina eficiencia con agrupación',
    pros: ['Flexible', 'Períodos medianos', 'Versátil'],
    cons: ['No maximiza', 'Solución intermedia'],
  },
];

export const Strategy = () => {
  const { strategy, setStrategy } = useFiltersStore(
    useShallow((state) => ({
      strategy: state.strategy,
      setStrategy: state.setStrategy,
    }))
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const currentStrategy = STRATEGIES.find(({ value }) => value === strategy);

  return (
    <Field className='space-y-2 w-full' data-tutorial='strategy'>
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
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <>
            <AnimateIcon animateOnHover>
              <CollapsibleTrigger className='flex items-center justify-between w-full p-2 text-xs font-medium hover:bg-muted/50 cursor-pointer rounded-md transition-colors'>
                <span>{detailsOpen ? 'Hide' : 'Expand'} strategy details</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', detailsOpen && 'rotate-180')} />
              </CollapsibleTrigger>
            </AnimateIcon>
          </>
          <CollapsibleContent>
            <Card className='p-4 bg-muted/50 mt-2 text-xs'>
              <div className='space-y-2'>
                <div className='flex items-start gap-3'>
                  {(() => {
                    const Icon = currentStrategy.icon;
                    return <Icon className='w-6 h-6 text-primary' />;
                  })()}
                  <div className='flex-1'>
                    <h4 className='font-semibold'>{currentStrategy.description}</h4>
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
          </CollapsibleContent>
        </Collapsible>
      )}
    </Field>
  );
};
