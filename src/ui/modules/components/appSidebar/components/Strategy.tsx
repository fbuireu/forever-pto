'use client';

import { useFiltersStore } from '@application/stores/filters';
import { Badge } from '@ui/components/primitives/badge';
import { Card, CardDescription } from '@ui/components/primitives/card';
import { Combobox } from '@ui/components/primitives/combobox';
import { cn } from '@ui/lib/utils';
import { FilterStrategy } from '@infrastructure/services/calendar/types';
import { AlertCircle, CheckCircle2, DicesIcon, Scale, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { ChevronDown } from '@ui/components/animate/icons/chevron-down';
import { AnimateIcon } from '@ui/components/animate/icons/icon';
import { Users } from '@ui/components/animate/icons/users';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/components/animate/base/collapsible';
import { useShallow } from 'zustand/react/shallow';

const STRATEGY_ICONS = {
  [FilterStrategy.GROUPED]: Users,
  [FilterStrategy.OPTIMIZED]: TrendingUp,
  [FilterStrategy.BALANCED]: Scale,
} as const;

export const Strategy = () => {
  const t = useTranslations('sidebar.strategy');
  const { strategy, setStrategy } = useFiltersStore(
    useShallow((state) => ({
      strategy: state.strategy,
      setStrategy: state.setStrategy,
    }))
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const strategies = useMemo(
    () => [
      {
        value: FilterStrategy.GROUPED,
        label: t('grouped.label'),
        icon: STRATEGY_ICONS[FilterStrategy.GROUPED],
        description: t('grouped.description'),
        subtitle: t('grouped.subtitle'),
        pros: [t('grouped.pros.0'), t('grouped.pros.1')],
        cons: [t('grouped.cons.0'), t('grouped.cons.1')],
      },
      {
        value: FilterStrategy.OPTIMIZED,
        label: t('optimized.label'),
        icon: STRATEGY_ICONS[FilterStrategy.OPTIMIZED],
        description: t('optimized.description'),
        subtitle: t('optimized.subtitle'),
        pros: [t('optimized.pros.0'), t('optimized.pros.1')],
        cons: [t('optimized.cons.0'), t('optimized.cons.1')],
      },
      {
        value: FilterStrategy.BALANCED,
        label: t('balanced.label'),
        icon: STRATEGY_ICONS[FilterStrategy.BALANCED],
        description: t('balanced.description'),
        subtitle: t('balanced.subtitle'),
        pros: [t('balanced.pros.0'), t('balanced.pros.1'), t('balanced.pros.2')],
        cons: [t('balanced.cons.0'), t('balanced.cons.1')],
      },
    ],
    [t]
  );

  const currentStrategy = strategies.find(({ value }) => value === strategy);

  return (
    <div className='space-y-2 w-full' data-tutorial='strategy'>
      <label className='flex gap-2 text-sm font-medium' htmlFor='strategy'>
        <DicesIcon size={16} /> {t('title')}
      </label>
      <Combobox
        className='w-full'
        id='strategy'
        options={strategies}
        value={strategy}
        onChange={setStrategy}
        disabled={!strategies.length}
        placeholder={t('placeholder')}
        searchPlaceholder={t('search')}
      />
      {currentStrategy && (
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <AnimateIcon animateOnHover>
            <CollapsibleTrigger className='flex items-center justify-between w-full p-2 text-xs font-medium hover:bg-muted/50 cursor-pointer rounded-md transition-colors'>
              <span>
                {detailsOpen ? t('hide') : t('expand')} {t('strategyDetails')}
              </span>
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', detailsOpen && 'rotate-180')} />
            </CollapsibleTrigger>
          </AnimateIcon>
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
    </div>
  );
};
