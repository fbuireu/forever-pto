'use client';

import { cn } from '@const/lib/utils';
import { Circle, Sparkles } from 'lucide-react';
import type { SVGMotionProps } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type ComponentType, useMemo, useState } from 'react';
import { FeatureList } from 'src/components/animate-ui/components/community/FeatureList';
import { RadialNav, type RadialNavProps } from 'src/components/animate-ui/components/community/radial-nav';
import { CircleCheckBig } from 'src/components/animate-ui/icons/circle-check-big';
import { Clock } from 'src/components/animate-ui/icons/clock';

interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  quarter?: string;
}

const CategoryStatus = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in-progress',
  PLANNED: 'planned',
  FUTURE: 'future',
} as const;

type CategoryStatus = (typeof CategoryStatus)[keyof typeof CategoryStatus];


export function Roadmap() {
  const t = useTranslations('roadmap');
  const [selectedCategory, setSelectedCategory] = useState<number>(1);

  const roadmapCategories = useMemo(
    () => [
      {
        id: 1,
        icon: CircleCheckBig as ComponentType<SVGMotionProps<SVGSVGElement>>,
        label: t('completed'),
        angle: 0,
        status: CategoryStatus.COMPLETED,
        className: 'text-green-500',
      },
      {
        id: 2,
        icon: Clock as ComponentType<SVGMotionProps<SVGSVGElement>>,
        label: t('inProgress'),
        angle: 90,
        status: CategoryStatus.IN_PROGRESS,
        className: 'text-blue-500',
      },
      {
        id: 3,
        icon: Circle as ComponentType<SVGMotionProps<SVGSVGElement>>,
        label: t('planned'),
        angle: 180,
        status: CategoryStatus.PLANNED,
        className: 'text-orange-500',
      },
      {
        id: 4,
        icon: Sparkles as ComponentType<SVGMotionProps<SVGSVGElement>>,
        label: t('future'),
        angle: 270,
        status: CategoryStatus.FUTURE,
        className: 'text-purple-500',
      },
    ],
    [t]
  );

  const roadmapFeatures: Record<CategoryStatus, RoadmapFeature[]> = useMemo(
    () => ({
      [CategoryStatus.COMPLETED]: [
        {
          id: '1',
          title: t('features.corePtoCalculator'),
          description: t('features.corePtoCalculatorDesc'),
          quarter: 'Q4 2024',
        },
        {
          id: '2',
          title: t('features.multipleCountries'),
          description: t('features.multipleCountriesDesc'),
          quarter: 'Q4 2024',
        },
        {
          id: '3',
          title: t('features.premiumFeatures'),
          description: t('features.premiumFeaturesDesc'),
          quarter: 'Q1 2025',
        },
        {
          id: '4',
          title: t('features.customHolidays'),
          description: t('features.customHolidaysDesc'),
          quarter: 'Q1 2025',
        },
      ],
      [CategoryStatus.IN_PROGRESS]: [
        {
          id: '5',
          title: t('features.alternativeStrategies'),
          description: t('features.alternativeStrategiesDesc'),
          quarter: 'Q1 2025',
        },
        {
          id: '6',
          title: t('features.analyticsDashboard'),
          description: t('features.analyticsDashboardDesc'),
          quarter: 'Q1 2025',
        },
      ],
      [CategoryStatus.PLANNED]: [
        {
          id: '7',
          title: t('features.calendarExport'),
          description: t('features.calendarExportDesc'),
          quarter: 'Q2 2025',
        },
        {
          id: '8',
          title: t('features.teamPlanning'),
          description: t('features.teamPlanningDesc'),
          quarter: 'Q2 2025',
        },
        {
          id: '9',
          title: t('features.emailNotifications'),
          description: t('features.emailNotificationsDesc'),
          quarter: 'Q2 2025',
        },
      ],
      [CategoryStatus.FUTURE]: [
        {
          id: '10',
          title: t('features.mobileApp'),
          description: t('features.mobileAppDesc'),
        },
        {
          id: '11',
          title: t('features.aiSuggestions'),
          description: t('features.aiSuggestionsDesc'),
        },
        {
          id: '12',
          title: t('features.weatherIntegration'),
          description: t('features.weatherIntegrationDesc'),
        },
        {
          id: '13',
          title: t('features.multiYearPlanning'),
          description: t('features.multiYearPlanningDesc'),
        },
      ],
    }),
    [t]
  );

  const selectedNavItem = roadmapCategories.find((cat) => cat.id === selectedCategory);
  const selectedStatus = selectedNavItem?.status ?? CategoryStatus.COMPLETED;
  const features = roadmapFeatures[selectedStatus];

  return (
    <div className='container max-w-4xl py-8 space-y-8 m-auto'>
      <div className='space-y-2 text-center mb-0'>
        <h3 className='text-3xl font-bold tracking-tight'>{t('title')}</h3>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </div>
      <div className='flex flex-col lg:flex-row gap-8 items-center mt-4'>
        <div className='lg:sticky lg:top-8 flex flex-col items-center w-full lg:w-auto'>
          <div className='relative h-80 w-80 flex items-center justify-center'>
            <RadialNav
              items={roadmapCategories as unknown as RadialNavProps['items']}
              onActiveChange={(id) => setSelectedCategory(id)}
              defaultActiveId={selectedCategory}
            />
          </div>
          {selectedNavItem && (
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>{t('selected')}</p>
              <p className={cn('text-lg font-semibold', selectedNavItem.className)}>{selectedNavItem.label}</p>
            </div>
          )}
        </div>
        <div className='flex-1 space-y-4 z-1'>
          <FeatureList features={features} categoryLabel={selectedNavItem?.label ?? 'Features'} />
        </div>
      </div>
    </div>
  );
}
