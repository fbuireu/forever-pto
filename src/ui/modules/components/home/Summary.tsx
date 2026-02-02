'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { usePremiumStore } from '@application/stores/premium';
import { Badge } from '@const/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { Award, BarChart3, Calendar, CalendarDays, Palmtree, TrendingUp, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Clock } from 'src/components/animate-ui/icons/clock';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
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
  const t = useTranslations('summary');
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
  const { suggestion, holidays, alternatives, currentSelection, manuallySelectedDays, removedSuggestedDays } =
    useHolidaysStore(
      useShallow((state) => ({
        suggestion: state.suggestion,
        holidays: state.holidays,
        alternatives: state.alternatives,
        currentSelection: state.currentSelection,
        manuallySelectedDays: state.manuallySelectedDays,
        removedSuggestedDays: state.removedSuggestedDays,
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
            {t('title', { year, nextYear: Number(year) + 1 })}
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
              <span className='font-semibold text-primary'>{ptoDays}</span> {t('metrics.vacationDays').toLowerCase()} +{' '}
              <span className='font-semibold text-green-700'>{holidayMetrics.totalHolidays}</span> {t('metrics.holidays').toLowerCase()} ={' '}
              <span className='font-semibold text-green-700 dark:text-green-300'>{effectiveDays}</span> {t('metrics.effectiveDays').toLowerCase()}
              {increment > 0 && (
                <span className='font-semibold text-purple-700 dark:text-purple-300 ml-1'>
                  {t('performance', { percentage: efficiencyPercentage.toFixed(0) })}
                </span>
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
            <MetricCard
              label={t('metrics.vacationDays')}
              value={ptoDays}
              icon={CalendarDays}
              badge={t('metrics.days')}
              colorScheme='blue'
            />
            <MetricCard
              label={t('metrics.holidays')}
              value={holidayMetrics.totalHolidays}
              icon={CalendarDays}
              badge={`${holidayMetrics.nationalDays} ${t('metrics.national')}${holidayMetrics.regionalDays > 0 ? ` + ${holidayMetrics.regionalDays} ${t('metrics.regional')}` : ''}${holidayMetrics.customDays > 0 ? ` + ${holidayMetrics.customDays} ${t('metrics.custom')}` : ''}`}
              colorScheme='green'
            />
            <MetricCard
              label={t('metrics.effectiveDays')}
              value={effectiveDays}
              icon={TrendingUp}
              badge={increment > 0 ? `+${increment} ${t('metrics.extra')}` : `0 ${t('metrics.extra')}`}
              colorScheme='purple'
            />
            <MetricCard
              label={t('metrics.multiplier')}
              value={efficiencyPercentage.toFixed(0)}
              symbol={'%'}
              icon={Zap}
              badge={t('metrics.performance')}
              colorScheme='amber'
            />
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
            <PremiumFeature feature={t('metrics.advancedMetrics')} iconSize='size-7'>
              <MetricCard
                label={t('metrics.longWeekends')}
                value={metrics.longWeekends}
                icon={Calendar}
                colorScheme='emerald'
                size={MetricCardSize.COMPACT}
              />
            </PremiumFeature>
            <PremiumFeature feature={t('metrics.advancedMetrics')} iconSize='size-7'>
              <MetricCard
                label={t('metrics.vacationPeriods')}
                value={metrics.restBlocks}
                icon={BarChart3}
                colorScheme='purple'
                size={MetricCardSize.COMPACT}
              />
            </PremiumFeature>
            <MetricCard
              label={t('metrics.dayOffRatio')}
              value={metrics.averageEfficiency.toFixed(1)}
              icon={TrendingUp}
              colorScheme='amber'
              size={MetricCardSize.COMPACT}
            />
            <PremiumFeature feature={t('metrics.advancedMetrics')} iconSize='size-7'>
              <MetricCard
                label={t('metrics.bridgesUsed')}
                value={metrics.bridgesUsed}
                icon={BarChart3}
                colorScheme='cyan'
                size={MetricCardSize.COMPACT}
              />
            </PremiumFeature>
            <MetricCard
              label={t('metrics.workdaysPerMonth')}
              value={metrics.workingDaysPerMonth}
              icon={Award}
              colorScheme='violet'
              size={MetricCardSize.COMPACT}
            />
            <MetricCard
              label={t('metrics.longestVacation')}
              value={metrics.longestVacation}
              symbol='d'
              icon={Palmtree}
              colorScheme='rose'
              size={MetricCardSize.COMPACT}
            />
          </div>
          {metrics.firstLastBreak && (
            <AnimateIcon animateOnHover>
              <PremiumFeature
                feature={t('yearSummary.feature')}
                description={t('yearSummary.featureDescription')}
                iconSize='size-7'
                inlineDescription
              >
                <div className='p-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Clock className='w-4 h-4 text-indigo-500' />
                    <span className='text-sm font-medium text-indigo-700 dark:text-indigo-300'>{t('yearSummary.title')}</span>
                  </div>
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-sm text-muted-foreground'>{t('yearSummary.firstBreak')}</div>
                      <div className='text-lg flex justify-center font-bold text-indigo-700 dark:text-indigo-300'>
                        <RotatingText text={metrics.firstLastBreak.first} />
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>{t('yearSummary.maxWorkStreak')}</div>
                      <div className='text-lg font-bold text-indigo-700 flex justify-center dark:text-indigo-300'>
                        <SlidingNumber number={metrics.maxWorkingPeriod} />d
                      </div>
                    </div>
                    <div>
                      <div className='text-sm text-muted-foreground'>{t('yearSummary.lastBreak')}</div>
                      <div className='text-lg font-bold text-indigo-700 dark:text-indigo-300'>
                        <RotatingText text={metrics.firstLastBreak.last} />
                      </div>
                    </div>
                  </div>
                  <div className='mt-3 text-center'>
                    <div className='text-xs text-muted-foreground mb-1'>{t('yearSummary.totalBonusDays')}</div>
                    <div className='text-2xl font-bold text-indigo-700 dark:text-indigo-300 flex justify-center'>
                      +<SlidingNumber number={metrics.bonusDays} />
                    </div>
                    <div className='text-xs text-indigo-600 dark:text-indigo-400'>{t('yearSummary.daysGained')}</div>
                  </div>
                </div>
              </PremiumFeature>
            </AnimateIcon>
          )}
          {canImprove > 0 && (
            <NotificationCard icon={Zap} title={t('notifications.canImprove.title')} colorScheme='orange'>
              <>
                {t('notifications.canImprove.message')}{' '}
                <strong className='flex gap-1 mx-1'>
                  <SlidingNumber number={canImprove} />
                  {t('notifications.canImprove.moreDays')}
                </strong>{' '}
                {t('notifications.canImprove.toYourPlan')}
                {premiumKey ? ` ${t('notifications.canImprove.reviewOptions')}` : ` ${t('notifications.canImprove.considerPremium')}`}
              </>
            </NotificationCard>
          )}
          {(manuallySelectedDays.length > 0 || removedSuggestedDays.length > 0) && (
            <NotificationCard icon={CalendarDays} title={t('notifications.manualAdjustments.title')} colorScheme='indigo' className='mt-2'>
              <>
                {manuallySelectedDays.length > 0 && (
                  <>
                    {t('notifications.manualAdjustments.added')}{' '}
                    <strong className='flex gap-1 mx-1'>
                      <SlidingNumber number={manuallySelectedDays.length} /> {manuallySelectedDays.length !== 1 ? t('notifications.manualAdjustments.days') : t('notifications.manualAdjustments.day')}
                    </strong>
                  </>
                )}
                {manuallySelectedDays.length > 0 && removedSuggestedDays.length > 0 && ` ${t('notifications.manualAdjustments.and')} `}
                {removedSuggestedDays.length > 0 && (
                  <>
                    {t('notifications.manualAdjustments.removed')}{' '}
                    <strong className='flex gap-1 mx-1'>
                      <SlidingNumber number={removedSuggestedDays.length} /> {removedSuggestedDays.length !== 1 ? t('notifications.manualAdjustments.days') : t('notifications.manualAdjustments.day')}
                    </strong>
                  </>
                )}
                {` ${t('notifications.manualAdjustments.fromOriginal')}`}
              </>
            </NotificationCard>
          )}
          {holidayMetrics.customDays > 0 && (
            <NotificationCard icon={CalendarDays} title={t('notifications.customHolidays.title')} colorScheme='blue'>
              <>
                {t('notifications.customHolidays.youHave')}{' '}
                <strong className='flex gap-1 mx-1'>
                  <SlidingNumber number={holidayMetrics.customDays} /> {holidayMetrics.customDays !== 1 ? t('notifications.customHolidays.holidays') : t('notifications.customHolidays.holiday')}
                </strong>{' '}
                {t('notifications.customHolidays.improvesPlan')}
              </>
            </NotificationCard>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
