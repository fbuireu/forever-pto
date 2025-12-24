import { Skeleton } from '@const/components/ui/skeleton';

export const PtoStatusSkeleton = () => (
  <div className='flex p-2 rounded-2xl border shadow-sm bg-background min-w-fit'>
    <div className='flex items-center justify-between flex-wrap gap-4'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-1'>
          <Skeleton className='h-3 w-3 rounded-full' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-8' />
        </div>
        <div className='flex items-center gap-1'>
          <Skeleton className='h-3 w-3 rounded-full' />
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-8' />
        </div>
        <div className='h-6 w-px bg-border' />
        <div className='flex items-center flex-col gap-1'>
          <Skeleton className='h-5 w-28' />
        </div>
      </div>
    </div>
  </div>
);
