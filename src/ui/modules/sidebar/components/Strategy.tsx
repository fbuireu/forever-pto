'use client';

import { useFiltersStore } from '@application/stores/filters';
import { FilterStrategy } from '@infrastructure/services/calendar/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/modules/core/animate/base/Collapsible';
import { ChevronDown } from '@ui/modules/core/animate/icons/ChevronDown';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Users } from '@ui/modules/core/animate/icons/Users';
import { Card, CardDescription } from '@ui/modules/core/primitives/Card';
import { Combobox } from '@ui/modules/core/primitives/Combobox';
import { cn } from '@ui/utils/utils';
import { AlertCircle, CheckCircle2, DicesIcon, Scale, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
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
                    <h4 className='font-semibold text-xs'>{currentStrategy.description}</h4>
                    <CardDescription className='text-xs'>{currentStrategy.subtitle}</CardDescription>
                  </div>
                </div>
                <div className='grid gap-1.5'>
                  <div className='flex flex-wrap gap-1'>
                    {currentStrategy.pros.map((pro) => (
                      <span
                        key={pro}
                        className='inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                      >
                        <CheckCircle2 className='w-2.5 h-2.5 shrink-0' />
                        {pro}
                      </span>
                    ))}
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {currentStrategy.cons.map((con) => (
                      <span
                        key={con}
                        className='inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400'
                      >
                        <AlertCircle className='w-2.5 h-2.5 shrink-0' />
                        {con}
                      </span>
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
