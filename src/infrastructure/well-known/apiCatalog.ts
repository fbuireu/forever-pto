import { NextResponse } from 'next/server';

export function apiCatalog(baseUrl: string) {
  return NextResponse.json(
    {
      linkset: [
        {
          anchor: baseUrl,
          'https://www.iana.org/assignments/link-relations/service-doc': [
            { href: `${baseUrl}/api/health`, type: 'application/json' },
          ],
          'https://www.iana.org/assignments/link-relations/status': [{ href: `${baseUrl}/api/health` }],
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/linkset+json',
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );
}
