'use client';

import { useCallback } from 'react';
import { driver } from 'driver.js';
import type { Driver } from 'driver.js';

let driverInstance: Driver | null = null;

export const useAppTutorial = () => {
  const startTutorial = useCallback(() => {
    // Destroy previous instance if exists
    if (driverInstance) {
      driverInstance.destroy();
    }

    driverInstance = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: [
        {
          element: '[data-tutorial="sidebar-filters"]',
          popover: {
            title: 'Filters & Configuration',
            description:
              'Here you can configure all your PTO preferences. Set your available PTO days, select your country and region to get accurate holidays, choose the year, and customize your optimization strategy.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="pto-days"]',
          popover: {
            title: 'PTO Days',
            description:
              'Enter the total number of PTO (Paid Time Off) days you have available for the year. This is the foundation for all calculations and suggestions.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="country"]',
          popover: {
            title: 'Country Selection',
            description:
              'Select your country to automatically load national holidays. This ensures your PTO suggestions avoid already-free days and maximize your time off.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="region"]',
          popover: {
            title: 'Region Selection',
            description:
              'Some countries have regional holidays. Select your specific region to get the most accurate holiday calendar for your area.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="year"]',
          popover: {
            title: 'Year Selection',
            description:
              'Choose the year you want to plan for. Holidays and suggestions will be generated for the selected year.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="strategy"]',
          popover: {
            title: 'Optimization Strategy',
            description:
              'Choose between different strategies: "Balanced" spreads your PTO evenly throughout the year, while "Optimized" maximizes efficiency by creating longer breaks with fewer PTO days.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="allow-past-days"]',
          popover: {
            title: 'Allow Past Days',
            description:
              'Toggle this option if you want to include dates that have already passed in the current year. Useful for planning retrospectively or for next year.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="carry-over"]',
          popover: {
            title: 'Carry Over Months',
            description:
              'If your PTO days carry over into the next year, specify how many months they remain valid. This helps you plan PTO usage across year boundaries.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="sidebar-tools"]',
          popover: {
            title: 'Calculators & Tools',
            description:
              'Access helpful calculators here: estimate your PTO based on work history, calculate the monetary value of unused PTO, or count workdays between dates.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tutorial="calendar-list"]',
          popover: {
            title: 'Your PTO Calendar',
            description:
              'This is your interactive calendar showing the entire year. Holidays are marked, and our AI-generated suggestions highlight the optimal days to take off. Click any day to manually select or deselect it.',
            side: 'top',
            align: 'center',
          },
        },
        {
          popover: {
            title: 'You\'re All Set!',
            description:
              'Now you know how to use Forever PTO to maximize your time off. Start by configuring your preferences in the sidebar, and let the app suggest the best PTO days for you. Enjoy your well-deserved breaks!',
          },
        },
      ],
      onDestroyStarted: () => {
        if (driverInstance) {
          driverInstance.destroy();
          driverInstance = null;
        }
      },
    });

    driverInstance.drive();
  }, []);

  return { startTutorial };
};
