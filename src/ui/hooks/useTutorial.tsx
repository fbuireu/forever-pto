'use client';

import type { DriveStep } from 'driver.js';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useSidebar } from '@ui/components/animate/base/sidebar';

const SIDEBAR_CONTAINER_SELECTOR = '[data-slot="sidebar-container"]';

export const useTutorial = () => {
  const { open, toggleSidebar } = useSidebar();
  const t = useTranslations('tutorial.steps');

  const startTutorial = useCallback(async () => {
    const [{ getDriverClientInstance }] = await Promise.all([
      import('@infrastructure/clients/tutorial/driver/client'),
      import('@ui/modules/components/core/DriverStyles'),
    ]);
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
        element: '[data-tutorial="holidays-list"]',
        popover: {
          title: t('holidaysListTitle'),
          description: t('holidaysListDescription'),
          side: 'bottom',
          align: 'start',
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

    if (!open) {
      toggleSidebar();
      await new Promise<void>((resolve) => {
        const el = document.querySelector(SIDEBAR_CONTAINER_SELECTOR);
        if (el) {
          el.addEventListener('transitionend', () => resolve(), { once: true });
        } else {
          resolve();
        }
      });
    }

    driverClient.start(steps);
  }, [open, t, toggleSidebar]);

  return { startTutorial };
};
