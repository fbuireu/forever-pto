import { Skeleton } from '@ui/modules/core/primitives/Skeleton';

export const PtoStatusSkeleton = () => (
  <div className='rounded-[14px] border-[3px] border-[var(--frame)] bg-card px-4 py-3 shadow-[var(--shadow-brutal-lg)]'>
    <div className='flex items-center justify-between flex-wrap gap-4 h-full'>
      <div className='flex items-center gap-4'>
        {/* auto assigned pill */}
        <Skeleton className='h-8 w-32 rounded-full' />
        {/* manual pill */}
        <Skeleton className='h-8 w-28 rounded-full' />
        {/* divider */}
        <div className='h-8 w-[2px] bg-border' />
        {/* remaining pill — taller to account for flex-col layout */}
        <Skeleton className='h-10 w-36 rounded-full' />
      </div>
    </div>
  </div>
);
