'use client';

import { LOCALES } from '@infrastructure/i18n/config';
import { useEffect } from 'react';

declare global {
  interface Navigator {
    modelContext?: {
      provideContext: (context: {
        tools: Array<{
          name: string;
          description: string;
          inputSchema: Record<string, unknown>;
          execute: (input: Record<string, unknown>) => Promise<unknown>;
        }>;
      }) => void;
    };
  }
}

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
              'PTO accrual calculator',
              'Export to Google Calendar, Outlook, Apple Calendar',
            ],
            locales: LOCALES,
            strategies: ['grouped', 'optimized', 'balanced'],
            url: window.location.origin,
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
