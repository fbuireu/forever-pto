'use client';

import { useLogger } from '@logtail/next';
import { type ReactNode, useEffect, useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';

export const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  const log = useLogger();
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  } | null>(null);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      const details = {
        message: error.message,
        stack: error.error?.stack,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
      };

      log.error('Error caught by error boundary', {
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      setErrorDetails(details);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      log.error('Unhandled promise rejection caught by error boundary', {
        reason: event.reason,
        promise: String(event.promise),
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });

      setErrorDetails({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [log]);

  const handleReload = () => {
    log.info('User triggered page reload after error', {
      errorMessage: errorDetails?.message,
    });
    window.location.reload();
  };

  if (hasError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2>Whoopsie! Something went wrong</h2>
          <Button type='button' onClick={handleReload} className='mt-4'>
            Reload page
          </Button>
        </div>
      </div>
    );
  }

  return children;
};
