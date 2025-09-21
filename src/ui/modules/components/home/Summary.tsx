'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { usePremiumStore } from '@application/stores/premium';
import { Badge } from '@const/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { Award, BarChart3, Calendar, CalendarDays, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

// Simple utility functions for useful metrics
const calculateLongWeekends = (dates: Date[]) => {
  if (!dates || dates.length === 0) return 0;

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let longWeekends = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const dayOfWeek = date.getDay();

    // Count Friday or Monday as potential long weekend
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      longWeekends++;
    }
  }

  return longWeekends;
};

const calculateQuarterDistribution = (dates: Date[]) => {
  const quarters = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4

  dates?.forEach((date) => {
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);
    quarters[quarter]++;
  });

  return quarters;
};

const getSeasonBalance = (quarters: number[]) => {
  const total = quarters.reduce((sum, q) => sum + q, 0);
  if (total === 0) return 'Sin datos';

  const max = Math.max(...quarters);
  const min = Math.min(...quarters);
  const isBalanced = max - min <= 1;

  return isBalanced ? 'Equilibrado' : 'Desbalanceado';
};

export const Summary = () => {
  const { ptoDays, country, region, strategy, year } = useFiltersStore(
    useShallow((state) => ({
      ptoDays: state.ptoDays,
      country: state.country,
      region: state.region,
      strategy: state.strategy,
      year: state.year,
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

  // Simple but useful metrics
  const metrics = useMemo(() => {
    const activeSuggestion = currentSelection || suggestion;
    if (!activeSuggestion?.days) return null;

    const longWeekends = calculateLongWeekends(activeSuggestion.days);
    const quarterDist = calculateQuarterDistribution(activeSuggestion.days);
    const seasonBalance = getSeasonBalance(quarterDist);

    // Best alternative available
    const bestAlternative = alternatives?.find((alt) => alt.totalEffectiveDays > activeSuggestion.totalEffectiveDays);
    const canImprove = bestAlternative ? bestAlternative.totalEffectiveDays - activeSuggestion.totalEffectiveDays : 0;

    return {
      longWeekends,
      seasonBalance,
      quarterDist,
      canImprove,
      hasAlternatives: alternatives && alternatives.length > 0,
    };
  }, [currentSelection, suggestion, alternatives]);

  // Basic calculations
  const effectiveDays = currentSelection?.totalEffectiveDays ?? suggestion?.totalEffectiveDays ?? 0;
  const increment = effectiveDays - ptoDays;
  const efficiencyPercentage = ptoDays > 0 ? (increment / ptoDays) * 100 : 0;

  // Holiday breakdown
  const regionalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL).length ?? 0;
  const nationalDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.NATIONAL).length ?? 0;
  const customDays = holidays?.filter((holiday) => holiday.variant === HolidayVariant.CUSTOM).length ?? 0;
  const totalHolidays = nationalDays + regionalDays + customDays;

  // Location info
  const userCountry = countries.find(({ label }) => label.toLowerCase() === country.toLowerCase());
  const userRegion = regions.find(({ label }) => label.toLowerCase() === region?.toLowerCase());

  const strategyNames = {
    GROUPED: 'Agrupada',
    DISTRIBUTED: 'Distribuida',
    MAXIMIZED: 'Maximizada',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 80 }}
      className='w-full max-w-5xl mx-auto space-y-6'
    >
      {/* Main Summary Card */}
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
                Estrategia: {strategyNames[strategy] || strategy}
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

          {metrics && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Long weekends */}
              <div className='p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <Calendar className='w-4 h-4 text-emerald-500' />
                  <span className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
                    Fines de Semana Largos
                  </span>
                </div>
                <div className='space-y-1'>
                  <div className='text-2xl font-bold text-emerald-700 dark:text-emerald-300'>
                    {metrics.longWeekends}
                  </div>
                  <div className='text-xs text-muted-foreground'>oportunidades de viaje</div>
                </div>
              </div>

              <div className='p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <BarChart3 className='w-4 h-4 text-cyan-500' />
                  <span className='text-sm font-medium text-cyan-700 dark:text-cyan-300'>Balance Estacional</span>
                </div>
                <div className='space-y-1'>
                  <div className='text-lg font-bold text-cyan-700 dark:text-cyan-300'>{metrics.seasonBalance}</div>
                  <div className='text-xs text-muted-foreground'>distribución del año</div>
                </div>
              </div>

              <div className='p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <Award className='w-4 h-4 text-violet-500' />
                  <span className='text-sm font-medium text-violet-700 dark:text-violet-300'>Potencial de Mejora</span>
                </div>
                <div className='space-y-1'>
                  <div className='text-2xl font-bold text-violet-700 dark:text-violet-300'>
                    {metrics.canImprove > 0 ? `+${metrics.canImprove}` : '✓'}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {metrics.canImprove > 0 ? 'días adicionales posibles' : 'optimizado'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {metrics?.quarterDist && (
            <div className='p-4 bg-slate-50 dark:bg-slate-900/20 rounded-lg'>
              <div className='flex items-center gap-2 mb-3'>
                <BarChart3 className='w-4 h-4 text-slate-500' />
                <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Distribución por Trimestre
                </span>
              </div>
              <div className='grid grid-cols-4 gap-4'>
                {metrics.quarterDist.map((days, index) => (
                  <div key={index} className='text-center'>
                    <div className='text-lg font-bold text-slate-700 dark:text-slate-300'>{days}</div>
                    <div className='text-xs text-muted-foreground'>Q{index + 1}</div>
                    <div className='w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1'>
                      <div
                        className='bg-slate-500 h-2 rounded-full transition-all duration-300'
                        style={{ width: `${Math.max(20, (days / Math.max(...metrics.quarterDist)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metrics?.canImprove > 0 && (
            <div className='p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800'>
              <div className='flex items-center gap-2 mb-2'>
                <Zap className='w-4 h-4 text-orange-500' />
                <span className='text-sm font-medium text-orange-700 dark:text-orange-300'>💡 Sugerencia</span>
              </div>
              <div className='text-sm text-orange-800 dark:text-orange-200'>
                Hay alternativas que te darían <strong>{metrics.canImprove} días más</strong>.
                {isPremium ? ' Revisa las opciones disponibles.' : ' Considera Premium para más análisis.'}
              </div>
            </div>
          )}

          {/* Custom holidays notice */}
          {customDays > 0 && (
            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
              <div className='text-sm text-blue-800 dark:text-blue-200'>
                <strong>🎯 Días personalizados:</strong> Has añadido {customDays} día{customDays !== 1 ? 's' : ''}
                que optimizan tu planificación.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
