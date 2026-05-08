'use client';

import { useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import type { DriveStep } from 'driver.js';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

const SIDEBAR_CONTAINER_SELECTOR = '[data-slot="sidebar-container"]';

export const useTutorial = () => {
  const { open, toggleSidebar } = useSidebar();
  const t = useTranslations('tutorial.steps');
  const tUi = useTranslations('tutorial');

  const startTutorial = useCallback(async () => {
    const [{ getDriverClientInstance }] = await Promise.all([
      import('@infrastructure/clients/tutorial/driver/client'),
      import('@ui/modules/tutorial/DriverStyles'),
    ]);
    const driverClient = getDriverClientInstance();

    const steps: DriveStep[] = [
      {
        element: '[data-tutorial="sidebar-step-1"]',
        popover: {
          title: t('step1Title', { step: 1 }),
          description: t('step1Description'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="sidebar-step-2"]',
        popover: {
          title: t('step2Title', { step: 2 }),
          description: t('step2Description'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="sidebar-step-3"]',
        popover: {
          title: t('step3Title', { step: 3 }),
          description: t('step3Description'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="sidebar-step-4"]',
        popover: {
          title: t('step4Title', { step: 4 }),
          description: t('step4Description'),
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

    driverClient.start(steps, {
      nextBtnText: tUi('nextBtn'),
      prevBtnText: tUi('prevBtn'),
      doneBtnText: tUi('doneBtn'),
      progressText: `{{current}} ${tUi('progressTextConnector')} {{total}}`,
    });
  }, [open, t, tUi, toggleSidebar]);

  return { startTutorial };
};
