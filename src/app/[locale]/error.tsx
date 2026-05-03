'use client';

import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';
import { Navigation } from '@ui/modules/pages/homepage/navigation/Navigation';
import { Footer } from '@ui/modules/shared/footer/Footer';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  return (
    <div className='min-h-screen flex flex-col text-foreground bg-background'>
      <Navigation />
      <ErrorContent error={error} reset={reset} />
      <Footer />
    </div>
  );
}
