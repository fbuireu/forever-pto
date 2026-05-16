'use client';

import { LOCALES } from '@infrastructure/i18n/locales';
import { useEffect } from 'react';

export function WebMCP() {
  useEffect(() => {
    if (!navigator.modelContext?.provideContext) return;

    navigator.modelContext.provideContext({
      tools: [
        {
          name: 'get_site_info',
          description:
            'Get information about Forever PTO — its features, supported locales, and optimization strategies.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          execute: async () => ({
            name: 'Forever PTO',
            description:
              'Free PTO optimization tool that maximizes vacation days by combining PTO with public holidays and bridge days.',
            features: [
              'National and regional holiday detection',
              'Bridge day optimizer',
              'Three strategies: Grouped, Optimized, Balanced',
              'Custom holidays: add, edit, and delete national and regional holidays',
              'Manual editing of suggested days off',
              'Year selection and carryover months configuration',
              'PTO accrual calculator',
              'PTO vs salary calculator',
              'Workday counter',
              'Date statistics',
              'Efficiency charts and graphs',
              'Export to Google Calendar, Outlook, Apple Calendar',
            ],
            locales: LOCALES,
            strategies: ['grouped', 'optimized', 'balanced'],
            url: globalThis.location.origin,
          }),
        },
        {
          name: 'check_status',
          description: 'Check the current operational status of the Forever PTO service.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          execute: async () => {
            const res = await fetch('/api/health');
            return res.json();
          },
        },
      ],
    });
  }, []);

  return null;
}
