'use client';

import { getDriverClientInstance } from '@infrastructure/clients/tutorial/driver/client';
import type { DriveStep } from 'driver.js';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useSidebar } from 'src/components/animate-ui/radix/sidebar';

export const useTutorial = () => {
  const { open, toggleSidebar } = useSidebar();
  const t = useTranslations('tutorial.steps');

  const startTutorial = useCallback(() => {
    if (!open) toggleSidebar();
    const driverClient = getDriverClientInstance();

    const steps: DriveStep[] = [
      {
        element: '[data-tutorial="sidebar-filters"]',
        popover: {
          title: t('filtersTitle'),
          description: t('filtersDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="pto-days"]',
        popover: {
          title: t('ptoDaysTitle'),
          description: t('ptoDaysDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="country"]',
        popover: {
          title: t('countryTitle'),
          description: t('countryDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="region"]',
        popover: {
          title: t('regionTitle'),
          description: t('regionDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="year"]',
        popover: {
          title: t('yearTitle'),
          description: t('yearDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="strategy"]',
        popover: {
          title: t('strategyTitle'),
          description: t('strategyDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="allow-past-days"]',
        popover: {
          title: t('allowPastDaysTitle'),
          description: t('allowPastDaysDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="carry-over"]',
        popover: {
          title: t('carryOverTitle'),
          description: t('carryOverDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="sidebar-tools"]',
        popover: {
          title: t('toolsTitle'),
          description: t('toolsDescription'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="alternatives-manager"]',
        popover: {
          title: t('alternativesTitle'),
          description: t('alternativesDescription'),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="pto-status"]',
        popover: {
          title: t('statusTitle'),
          description: t('statusDescription'),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tutorial="calendar-list"]',
        popover: {
          title: t('calendarTitle'),
          description: t('calendarDescription'),
          side: 'top',
          align: 'center',
        },
      },
      {
        popover: {
          title: t('finishTitle'),
          description: t('finishDescription'),
        },
      },
    ];

    driverClient.start(steps);
  }, [open, t, toggleSidebar]);

  return { startTutorial };
};
