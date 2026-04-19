import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/primitives/card';
import { Skeleton } from '@ui/components/primitives/skeleton';

export const SummarySkeleton = () => {
  return (
    <div className='w-full max-w-4xl mx-auto space-y-6 z-1'>
      <Card>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center flex-col gap-2 justify-between mx-auto mb-2'>
            <div className='flex items-center gap-2 text-center'>
              <Skeleton className='h-6 w-80' />
            </div>
            <div className='flex flex-wrap items-center gap-2 justify-center'>
              <Skeleton className='h-5 w-16 rounded-full' />
              <Skeleton className='h-5 w-20 rounded-full' />
              <Skeleton className='h-5 w-24 rounded-full' />
            </div>
          </CardTitle>
          <CardDescription className='space-y-2'>
            <div className='space-y-1'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-64 w-full rounded-[10px]' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-64 w-full rounded-[10px]' />
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-64 w-full rounded-[10px]' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-64 w-full rounded-[10px]' />
            </div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {Array.from({ length: 4 }).map(() => (
              <div
                key={crypto.randomUUID()}
                className='flex flex-col items-center p-4 bg-[var(--surface-panel-soft)] rounded-[10px] space-y-2'
              >
                <Skeleton className='h-3 w-16' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='w-4 h-4 rounded-sm' />
                  <Skeleton className='h-6 w-8' />
                </div>
                <Skeleton className='h-4 w-12 rounded-full' />
              </div>
            ))}
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
            {Array.from({ length: 6 }).map(() => (
              <div
                key={crypto.randomUUID()}
                className='p-3 bg-[var(--surface-panel-soft)] rounded-[10px] text-center space-y-1'
              >
                <Skeleton className='w-4 h-4 mx-auto rounded-sm' />
                <Skeleton className='h-5 w-8 mx-auto' />
                <Skeleton className='h-3 w-12 mx-auto' />
              </div>
            ))}
          </div>
          <div className='p-4 bg-[var(--surface-panel-inset)] rounded-[10px] space-y-3'>
            <div className='flex items-center gap-2'>
              <Skeleton className='w-4 h-4 rounded-sm' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='grid grid-cols-3 gap-4 text-center'>
              {Array.from({ length: 3 }).map(() => (
                <div key={crypto.randomUUID()} className='space-y-1'>
                  <Skeleton className='h-3 w-20 mx-auto' />
                  <Skeleton className='h-5 w-12 mx-auto' />
                </div>
              ))}
            </div>
            <div className='text-center space-y-1'>
              <Skeleton className='h-3 w-24 mx-auto' />
              <Skeleton className='h-6 w-16 mx-auto' />
              <Skeleton className='h-3 w-28 mx-auto' />
            </div>
          </div>
          <div className='space-y-4'>
            <div className='p-4 bg-[var(--surface-panel-inset)] rounded-[10px] border-[3px] border-[var(--frame)] space-y-2'>
              <div className='flex items-center gap-2'>
                <Skeleton className='w-4 h-4 rounded-sm' />
                <Skeleton className='h-4 w-20' />
              </div>
              <div className='space-y-1'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-2/3' />
              </div>
            </div>
            <div className='p-3 bg-[var(--surface-panel-inset)] rounded-[10px] border-[3px] border-[var(--frame)] space-y-2'>
              <Skeleton className='h-3 w-full' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
