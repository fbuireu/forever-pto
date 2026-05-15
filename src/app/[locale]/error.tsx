'use client';

import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';
import type { ErrorBoundaryProps } from '@ui/modules/pages/error/types';

export default function ErrorPage({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className='min-h-screen flex flex-col text-foreground bg-background'>
      <ErrorContent error={error} reset={reset} />
    </div>
  );
}
