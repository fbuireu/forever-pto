'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { usePremiumStore } from '@application/stores/premium';
import { Badge } from '@const/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { Award, BarChart3, Calendar, CalendarDays, TrendingUp, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Clock } from 'src/components/animate-ui/icons/clock';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { Star } from 'src/components/animate-ui/icons/star';
import { RotatingText } from 'src/components/animate-ui/text/rotating';
import { SlidingNumber } from 'src/components/animate-ui/text/sliding-number';
import { useShallow } from 'zustand/react/shallow';
import { PremiumFeature } from '../premium/PremiumFeature';
import { SummarySkeleton } from '../skeletons/SummarySkeleton';
import { MetricCard, MetricCardSize } from '../summary/MetricCard';
import { NotificationCard } from '../summary/NotificationCard';

const HolidaysDistributionChart = dynamic(() =>
  import('../summary/HolidaysDistributionChart').then((module) => ({ default: module.HolidaysDistributionChart }))
);
const QuarterDistributionChart = dynamic(() =>
  import('../summary/QuarterDistributionChart').then((module) => ({ default: module.QuarterDistributionChart }))
);
const BlocksPerQuarterChart = dynamic(() =>
  import('../summary/BlocksPerQuarterChart').then((module) => ({ default: module.BlocksPerQuarterChart }))
);
const MonthlyDistributionChart = dynamic(() =>
  import('../summary/MonthlyDistributionChart').then((module) => ({ default: module.MonthlyDistributionChart }))
);

export const Summary = () => {
  const { areStoresReady } = useStoresReady();

  const { ptoDays, country, region, strategy, year, carryOverMonths } = useFiltersStore(
    useShallow((state) => ({
      ptoDays: state.ptoDays,
      country: state.country,
      region: state.region,
      strategy: state.strategy,
      year: state.year,
      carryOverMonths: state.carryOverMonths ?? 0,
    }))
  );
  const { suggestion, holidays, alternatives, currentSelection } = useHolidaysStore(
    useShallow((state) => ({
      suggestion: state.suggestion,
      holidays: state.holidays,
      alternatives: state.alternatives,
      currentSelection: state.currentSelection,
    }))
  );
  const { countries, regions } = useLocationStore(
    useShallow((state) => ({
      countries: state.countries,
      regions: state.regions,
    }))
  );
  const { premiumKey } = usePremiumStore(
    useShallow((state) => ({
      premiumKey: state.premiumKey,
    }))
  );

  const activeSuggestion = currentSelection ?? suggestion;

  const holidayMetrics = useMemo(() => {
    const regionalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL).length ?? 0;
    const nationalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.NATIONAL).length ?? 0;
    const customDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.CUSTOM).length ?? 0;
    const totalHolidays = nationalDays + regionalDays + customDays;
    return { regionalDays, nationalDays, customDays, totalHolidays };
  }, [holidays]);

  const locationInfo = useMemo(() => {
    const userCountry = countries.find(({ value }) => value.toLowerCase() === country.toLowerCase());
    const userRegion = regions.find(({ value }) => value.toLowerCase() === region?.toLowerCase());
    return { userCountry, userRegion };
  }, [countries, country, regions, region]);

  const metricsData = useMemo(() => {
    if (!activeSuggestion?.metrics) {
      return null;
    }

    const { metrics } = activeSuggestion;
    const effectiveDays = metrics.totalEffectiveDays;
    const increment = effectiveDays - ptoDays;
    const efficiencyPercentage = ptoDays > 0 ? (increment / ptoDays) * 100 : 0;

    const maxAlternative = Math.max(
      effectiveDays,
      ...(alternatives?.map((a) => a?.metrics?.totalEffectiveDays).filter((n): n is number => typeof n === 'number') ??
        [])
    );
    const canImprove = Math.max(0, maxAlternative - effectiveDays);

    return {
      metrics,
      effectiveDays,
      increment,
      efficiencyPercentage,
      maxAlternative,
      canImprove,
    };
  }, [activeSuggestion, ptoDays, alternatives]);

  if (!areStoresReady) {
    return <SummarySkeleton />;
  }

  if (!metricsData) {
    return null;
  }

  const { metrics, effectiveDays, increment, efficiencyPercentage, canImprove } = metricsData;

  return (
    <div className='w-full max-w-4xl mx-auto space-y-6 z-1'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-3xl font-bold text-center'>
            Resumen de PTO {year} - {Number(year) + 1}
            <div className='flex flex-wrap items-center gap-2 mt-2 mb-4 justify-center'>
              <Badge variant='outline' className='mx-1'>
                <span className='mr-2'>{locationInfo.userCountry?.flag}</span>
                <span>{locationInfo.userCountry?.label}</span>
              </Badge>
              {region && locationInfo.userRegion && (
                <Badge variant='secondary' className='mx-1'>
                  <span>{locationInfo.userRegion.label}</span>
                </Badge>
              )}
              <Badge variant='outline' className='bg-blue-50 dark:bg-blue-900/20'>
                {strategy}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className='text-muted-foreground space-y-2'>
            <div className='text-sm'>
              Con <span className='font-semibold text-primary'>{ptoDays}</span> días de PTO y{' '}
              <span className='font-semibold text-green-700'>{holidayMetrics.totalHolidays}</span> festivos disponibles,
              obtienes <span className='font-semibold text-green-700 dark:text-green-300'>{effectiveDays}</span> días
              libres efectivos.
              {increment > 0 && (
                <>
                  {' '}
                  Esto es{' '}
                  <span className='font-semibold text-purple-700 dark:text-purple-300'>
                    {increment} días más ({efficiencyPercentage.toFixed(0)}% extra)
                  </span>{' '}
                  que usar solo tus PTOs.
                </>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
            <HolidaysDistributionChart ptoDays={ptoDays} holidays={holidays ?? []} />
            <QuarterDistributionChart quarterDist={metrics.quarterDist} />
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
            <BlocksPerQuarterChart blocksPerQuarter={metrics.longBlocksPerQuarter} />
            <MonthlyDistributionChart
              monthlyDist={metrics.monthlyDist}
              year={Number(year)}
              carryOverMonths={carryOverMonths}
            />
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <MetricCard label='PTO Base' value={ptoDays} icon={CalendarDays} badge='días' colorScheme='blue' />
            <MetricCard
              label='Festivos'
              value={holidayMetrics.totalHolidays}
              icon={CalendarDays}
              badge={`${holidayMetrics.nationalDays}N + ${holidayMetrics.regionalDays}R${holidayMetrics.customDays > 0 ? ` + ${holidayMetrics.customDays}C` : ''}`}
              colorScheme='green'
            />
            <MetricCard
              label='Total Efectivo'
              value={effectiveDays}
              icon={TrendingUp}
              badge={increment > 0 ? `+${increment} extra` : '0 extra'}
              colorScheme='purple'
            />
            <MetricCard
              label='Eficiencia'
              value={efficiencyPercentage.toFixed(0)}
              symbol={'%'}
              icon={Zap}
              badge='ganancia'
              colorScheme='amber'
            />
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
            <PremiumFeature feature={'Métricas Avanzadas'} iconSize='size-7'>
              <MetricCard
                label='Findes largos'
                value={metrics.longWeekends}
                icon={Calendar}
                colorScheme='emerald'
                size={MetricCardSize.COMPACT}
              />
            </PremiumFeature>
            <PremiumFeature feature={'Métricas Avanzadas'} iconSize='size-7'>
              <MetricCard
                label='Bloques'
                value={metrics.restBlocks}
                icon={BarChart3}
                colorScheme='purple'
                size={MetricCardSize.COMPACT}
              />
            </PremiumFeature>
            <MetricCard
              label='Promedio'
              value={metrics.averageEfficiency.toFixed(1)}
              icon={TrendingUp}
              colorScheme='amber'
              size={MetricCardSize.COMPACT}
            />
            <PremiumFeature feature={'Métricas Avanzadas'} iconSize='size-7'>
              <MetricCard
                label='Puentes usados'
                value={metrics.bridgesUsed}
                icon={BarChart3}
                colorScheme='cyan'
                size={MetricCardSize.COMPACT}
              />
            </PremiumFeature>
            <MetricCard
              label='Average working days per month'
              value={metrics.workingDaysPerMonth}
              icon={Award}
              colorScheme='violet'
              size={MetricCardSize.COMPACT}
            />
            <MetricCard
              label='Bonus'
              value={`+${metrics.bonusDays}`}
              icon={Star}
              colorScheme='rose'
              size={MetricCardSize.COMPACT}
            />
          </div>
          {metrics.firstLastBreak && (
            <AnimateIcon animateOnHover>
              <PremiumFeature
                feature={'Year Summary'}
                description={'Análisis detallado de tus días libres.'}
                iconSize='size-7'
                inlineDescription
              >
                <div className='p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Clock className='w-4 h-4 text-indigo-500' />
                    <span className='text-sm font-medium text-indigo-700 dark:text-indigo-300'>Resumen del Año</span>
                  </div>
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-sm text-muted-foreground'>Primer descanso</div>
                      <div className='text-lg flex justify-center font-bold text-indigo-700 dark:text-indigo-300'>
                        <RotatingText text={metrics.firstLastBreak.first} />
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>Max trabajo seguido</div>
                      <div className='text-lg font-bold text-indigo-700 flex justify-center dark:text-indigo-300'>
                        <SlidingNumber number={metrics.maxWorkingPeriod} />d
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>Último descanso</div>
                      <div className='text-lg font-bold text-indigo-700 dark:text-indigo-300'>
                        <RotatingText text={metrics.firstLastBreak.last} />
                      </div>
                    </div>
                  </div>
                  <div className='mt-3 text-center'>
                    <div className='text-xs text-muted-foreground mb-1'>Días bonus totales</div>
                    <div className='text-2xl font-bold text-indigo-700 dark:text-indigo-300 flex justify-center'>
                      +<SlidingNumber number={metrics.bonusDays} />
                    </div>
                    <div className='text-xs text-indigo-600 dark:text-indigo-400'>días gratis obtenidos</div>
                  </div>
                </div>
              </PremiumFeature>
            </AnimateIcon>
          )}
          {canImprove > 0 && (
            <NotificationCard icon={Zap} title='Sugerencia' colorScheme='orange'>
              <>
                Hay alternativas que te darían{' '}
                <strong className='flex gap-1 mx-1'>
                  <SlidingNumber number={canImprove} />
                  días más.
                </strong>
                {premiumKey ? 'Revisa las opciones disponibles.' : 'Considera Premium para más análisis.'}
              </>
            </NotificationCard>
          )}
          {holidayMetrics.customDays > 0 && (
            <NotificationCard icon={CalendarDays} title='Días personalizados:' colorScheme='blue'>
              Has añadido{' '}
              <strong className='flex gap-1 mx-1'>
                <SlidingNumber number={holidayMetrics.customDays} /> día${holidayMetrics.customDays !== 1 ? 's' : ''}
              </strong>{' '}
              que optimizan tu planificación.
            </NotificationCard>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
