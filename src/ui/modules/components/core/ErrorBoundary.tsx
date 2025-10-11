'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';

export const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught by error boundary:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2>Something went wrong</h2>
          <Button type='button' onClick={() => window.location.reload()} className='mt-4'>
            Reload page
          </Button>
        </div>
      </div>
    );
  }

  return children;
};
