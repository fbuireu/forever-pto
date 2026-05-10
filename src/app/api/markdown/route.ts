import { LOCALES } from '@infrastructure/i18n/locales';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getTranslations } from 'next-intl/server';
import pkg from '../../../../package.json';

export const dynamic = 'force-dynamic';

function extractLocale(pathname: string): string {
  const segment = pathname.split('/')[1];
  return LOCALES.includes(segment) ? segment : 'en';
}

async function buildMarkdown(baseUrl: string, pathname: string): Promise<string> {
  const locale = extractLocale(pathname);
  const isPlanner = pathname.includes('/planner');
  const namespace = 'metadata';

  const t = await getTranslations({ locale, namespace });

  if (isPlanner) {
    const tPlanner = await getTranslations({ locale, namespace: 'planner' });

    return `# ${t('planner.title')}

${t('planner.description')}

## ${tPlanner('title')}

${tPlanner('description')}

## Features

- Holiday calendar with national and regional public holidays
- Bridge day suggestions (connect short weekends into multi-day breaks)
- Three optimization strategies: Grouped, Optimized, Balanced
- PTO accrual calculator and salary calculator
- Export to Google Calendar, Outlook, and Apple Calendar

## How to Use

1. The planner auto-detects your country via your IP
2. Adjust country and region if needed
3. Choose a strategy: Grouped (fewest trips), Optimized (best ROI), or Balanced
4. Review suggested days and manually edit as needed
5. Export your schedule

## Version

${pkg.version}

## URL

${baseUrl}/${locale}/planner
`;
  }

  return `# ${t('title')}

${t('description')}

## Features

- **Holiday Detection** — Automatic country detection with national and regional holidays
- **Bridge Day Optimizer** — Identifies the best days to take off to maximize streaks
- **Three Strategies** — Grouped (fewest trips), Optimized (best efficiency), Balanced
- **Calculations** — PTO accrual, PTO vs salary, workday counter, date stats
- **Export** — Send your schedule to Google Calendar, Outlook, or Apple Calendar
- **Multilingual** — Available in English, Spanish, Catalan, Italian, French, and German

## How It Works

1. Open the planner at ${baseUrl}/${locale}/planner
2. Your country is detected automatically; adjust country and region if needed
3. Select a year and optimization strategy
4. The planner generates a list of suggested PTO days that bridge holidays
5. Review suggestions, make manual edits, then export

## API

- \`GET /api/health\` — Service status check

## Version

${pkg.version}

## Site

${baseUrl}
`;
}

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? 'https://foreverpto.com';
  const url = new URL(request.url);
  const pathname = url.searchParams.get('path') ?? '/';

  const body = await buildMarkdown(baseUrl, pathname);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
