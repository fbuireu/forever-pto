'use client ';

import { Link } from '@application/i18n/navigtion';

export const SiteSubtitle = () => (
  <p className='text-center text-muted-foreground mt-2 mb-16'>
    Start by adding your days on the left sidebar and the rest of your configurations. Still Doubts?{' '}
    <Link className='hover:underline' href='#faq'>
      Check our FAQs
    </Link>
  </p>
);
