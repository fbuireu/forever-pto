'use client';

import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';
import type { ErrorBoundaryProps } from '@ui/modules/pages/error/types';

export default function ErrorPage({ error, reset }: ErrorBoundaryProps) {
  return <ErrorContent error={error} reset={reset} />;
}
