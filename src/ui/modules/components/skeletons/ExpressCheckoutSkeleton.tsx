import { Skeleton } from '@const/components/ui/skeleton';

export const ExpressCheckoutSkeleton = () => (
  <div className='gap-2 flex'>
    <Skeleton className='h-12 flex-1' />
    <Skeleton className='h-12 flex-1' />
    <Skeleton className='h-12 flex-1' />
  </div>
);
