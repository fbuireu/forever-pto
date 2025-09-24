'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { usePremiumStore } from '@application/stores/premium';
import { Badge } from '@const/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { Award, BarChart3, Calendar, CalendarDays, Clock, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';

const HolidaysDistributionChart = dynamic(() =>
  import('../summary/HolidaysDistributionChart').then((module) => ({ default: module.HolidaysDistributionChart }))
);
const QuarterDistributionChart = dynamic(() =>
  import('../summary/QuarterDistributionChart').then((module) => ({ default: module.QuarterDistributionChart }))
);
const LongBlockPerQuarterChart = dynamic(() =>
  import('../summary/BlocksPerQuarterChart').then((module) => ({ default: module.BlocksPerQuarterChart }))
);
const MonthlyDistributionChart = dynamic(() =>
  import('../summary/MonthlyDistributionChart').then((module) => ({ default: module.MonthlyDistributionChart }))
);

export const Summary = () => {
  const { ptoDays, country, region, strategy, year, carryOverMonths } = useFiltersStore(
    useShallow((state) => ({
      ptoDays: state.ptoDays,
      country: state.country,
      region: state.region,
      strategy: state.strategy,
      year: state.year,
      carryOverMonths: state.carryOverMonths || 0,
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

  const { isPremium } = usePremiumStore(
    useShallow((state) => ({
      isPremium: state.isPremium,
    }))
  );

  const activeSuggestion = currentSelection || suggestion;

  if (!activeSuggestion?.metrics) {
    return null;
  }

  const { metrics } = activeSuggestion;
  const effectiveDays = metrics.totalEffectiveDays;
  const increment = effectiveDays - ptoDays;
  const efficiencyPercentage = ptoDays > 0 ? (increment / ptoDays) * 100 : 0;
  const regionalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL).length ?? 0;
  const nationalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.NATIONAL).length ?? 0;
  const customDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.CUSTOM).length ?? 0;
  const totalHolidays = nationalDays + regionalDays + customDays;
  const userCountry = countries.find(({ label }) => label.toLowerCase() === country.toLowerCase());
  const userRegion = regions.find(({ label }) => label.toLowerCase() === region?.toLowerCase());
  const maxAlternative = Math.max(
    effectiveDays,
    ...(alternatives?.map((a) => a?.metrics?.totalEffectiveDays).filter((n): n is number => typeof n === 'number') ??
      [])
  );
  const canImprove = Math.max(0, maxAlternative - effectiveDays);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
      className='w-full max-w-6xl mx-auto space-y-6'
    >
      <Card className='shadow-lg border-2 border-primary/30 bg-gradient-to-br from-background via-muted/40 to-background rounded-2xl'>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-primary'>
              <Sparkles className='w-5 h-5 text-amber-500 animate-pulse' />
              Resumen de PTO {year}
            </div>
            {isPremium && (
              <Badge
                variant='outline'
                className='bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400'
              >
                <Star className='w-3 h-3 mr-1' />
                Premium
              </Badge>
            )}
          </CardTitle>
          <CardDescription className='text-muted-foreground space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='mx-1'>
                {userCountry?.label || country}
              </Badge>
              {region && userRegion && (
                <>
                  <span className='text-xs'>región</span>
                  <Badge variant='secondary' className='mx-1'>
                    {userRegion.label}
                  </Badge>
                </>
              )}
              <span className='text-xs'>•</span>
              <Badge variant='outline' className='bg-blue-50 dark:bg-blue-900/20'>
                Estrategia: {strategy}
              </Badge>
            </div>
            <div className='text-sm'>
              Con <span className='font-semibold text-primary'>{ptoDays}</span> días de PTO y{' '}
              <span className='font-semibold text-green-700'>{totalHolidays}</span> festivos disponibles, obtienes{' '}
              <span className='font-semibold text-green-700 dark:text-green-300'>{effectiveDays}</span> días libres
              efectivos.
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
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <HolidaysDistributionChart ptoDays={ptoDays} holidays={holidays} />
            <QuarterDistributionChart quarterDist={metrics.quarterDist} />
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <LongBlockPerQuarterChart blocksPerQuarter={metrics.longBlocksPerQuarter} />
            <MonthlyDistributionChart
              monthlyDist={metrics.monthlyDist}
              year={Number(year)}
              carryOverMonths={carryOverMonths}
            />
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
              <span className='text-xs text-muted-foreground mb-1'>PTO Base</span>
              <div className='flex items-center gap-2'>
                <CalendarDays className='w-4 h-4 text-blue-500' />
                <span className='text-xl font-bold text-blue-700 dark:text-blue-300'>{ptoDays}</span>
              </div>
              <Badge variant='outline' className='text-xs mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30'>
                días
              </Badge>
            </div>

            <div className='flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
              <span className='text-xs text-muted-foreground mb-1'>Festivos</span>
              <div className='flex items-center gap-2'>
                <CalendarDays className='w-4 h-4 text-green-500' />
                <span className='text-xl font-bold text-green-700 dark:text-green-300'>{totalHolidays}</span>
              </div>
              <Badge variant='outline' className='text-xs mt-1 bg-green-100 text-green-700 dark:bg-green-900/30'>
                {nationalDays}N + {regionalDays}R {customDays > 0 && `+ ${customDays}C`}
              </Badge>
            </div>

            <div className='flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
              <span className='text-xs text-muted-foreground mb-1'>Total Efectivo</span>
              <div className='flex items-center gap-2'>
                <TrendingUp className='w-4 h-4 text-purple-500' />
                <span className='text-xl font-bold text-purple-700 dark:text-purple-300'>{effectiveDays}</span>
              </div>
              <Badge variant='outline' className='text-xs mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30'>
                {increment > 0 ? `+${increment}` : '0'} extra
              </Badge>
            </div>
            <div className='flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
              <span className='text-xs text-muted-foreground mb-1'>Eficiencia</span>
              <div className='flex items-center gap-2'>
                <Zap className='w-4 h-4 text-amber-500' />
                <span className='text-xl font-bold text-amber-700 dark:text-amber-300'>
                  {efficiencyPercentage.toFixed(0)}%
                </span>
              </div>
              <Badge variant='outline' className='text-xs mt-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30'>
                ganancia
              </Badge>
            </div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
            <div className='p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center'>
              <Calendar className='w-4 h-4 text-emerald-500 mx-auto mb-1' />
              <div className='text-lg font-bold text-emerald-700 dark:text-emerald-300'>{metrics.longWeekends}</div>
              <div className='text-xs text-muted-foreground'>Fines largos</div>
            </div>

            <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center'>
              <BarChart3 className='w-4 h-4 text-purple-500 mx-auto mb-1' />
              <div className='text-lg font-bold text-purple-700 dark:text-purple-300'>{metrics.restBlocks}</div>
              <div className='text-xs text-muted-foreground'>Bloques</div>
            </div>

            <div className='p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center'>
              <TrendingUp className='w-4 h-4 text-amber-500 mx-auto mb-1' />
              <div className='text-lg font-bold text-amber-700 dark:text-amber-300'>
                {metrics.averageEfficiency.toFixed(1)}
              </div>
              <div className='text-xs text-muted-foreground'>Promedio</div>
            </div>

            <div className='p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-center'>
              <BarChart3 className='w-4 h-4 text-cyan-500 mx-auto mb-1' />
              <div className='text-lg font-bold text-cyan-700 dark:text-cyan-300'>{metrics.activeQuarters}</div>
              <div className='text-xs text-muted-foreground'>Trimestres</div>
            </div>

            <div className='p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-center'>
              <Award className='w-4 h-4 text-violet-500 mx-auto mb-1' />
              <div className='text-lg font-bold text-violet-700 dark:text-violet-300'>
                {canImprove > 0 ? `+${canImprove}` : '✓'}
              </div>
              <div className='text-xs text-muted-foreground'>Potencial</div>
            </div>

            <div className='p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-center'>
              <Star className='w-4 h-4 text-rose-500 mx-auto mb-1' />
              <div className='text-lg font-bold text-rose-700 dark:text-rose-300'>+{metrics.bonusDays}</div>
              <div className='text-xs text-muted-foreground'>Bonus</div>
            </div>
          </div>
          {metrics.firstLastBreak && (
            <div className='p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <Clock className='w-4 h-4 text-indigo-500' />
                <span className='text-sm font-medium text-indigo-700 dark:text-indigo-300'>Resumen del Año</span>
              </div>
              <div className='grid grid-cols-3 gap-4 text-center'>
                <div>
                  <div className='text-sm text-muted-foreground'>Primer descanso</div>
                  <div className='text-lg font-bold text-indigo-700 dark:text-indigo-300'>
                    {metrics.firstLastBreak.first}
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Max trabajo seguido</div>
                  <div className='text-lg font-bold text-indigo-700 dark:text-indigo-300'>
                    {metrics.maxWorkingPeriod}d
                  </div>
                </div>
                <div>
                  <div className='text-sm text-muted-foreground'>Último descanso</div>
                  <div className='text-lg font-bold text-indigo-700 dark:text-indigo-300'>
                    {metrics.firstLastBreak.last}
                  </div>
                </div>
              </div>
              <div className='mt-3 text-center'>
                <div className='text-xs text-muted-foreground mb-1'>Días bonus totales</div>
                <div className='text-2xl font-bold text-indigo-700 dark:text-indigo-300'>+{metrics.bonusDays}</div>
                <div className='text-xs text-indigo-600 dark:text-indigo-400'>días gratis obtenidos</div>
              </div>
            </div>
          )}
          {canImprove > 0 && (
            <div className='p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800'>
              <div className='flex items-center gap-2 mb-2'>
                <Zap className='w-4 h-4 text-orange-500' />
                <span className='text-sm font-medium text-orange-700 dark:text-orange-300'>Sugerencia</span>
              </div>
              <div className='text-sm text-orange-800 dark:text-orange-200'>
                Hay alternativas que te darían <strong>{canImprove} días más</strong>.
                {isPremium ? ' Revisa las opciones disponibles.' : ' Considera Premium para más análisis.'}
              </div>
            </div>
          )}
          {customDays > 0 && (
            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
              <div className='text-sm text-blue-800 dark:text-blue-200'>
                <strong>Días personalizados:</strong> Has añadido {customDays} día{customDays !== 1 ? 's' : ''}
                que optimizan tu planificación.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
