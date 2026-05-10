'use client';

import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  return <ErrorContent error={error} reset={reset} />;
}
