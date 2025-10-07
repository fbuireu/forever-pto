import { Skeleton } from '@const/components/ui/skeleton';
import { ChevronLeft } from 'src/components/animate-ui/icons/chevron-left';
import { ChevronRight } from 'src/components/animate-ui/icons/chevron-right';

export const AlternativesManagerSkeleton = () => (
  <div className='flex items-center justify-between py-1 px-2 bg-background border rounded-lg'>
    <div className='flex items-center gap-1'>
      <button className='p-1 rounded-md hover:bg-muted disabled:opacity-50' disabled>
        <ChevronLeft className='h-10 w-4' animateOnHover/>
      </button>
      <div className='flex items-center gap-1'>
        <Skeleton className='h-10 w-30 rounded-md' />
      </div>
      <button className='p-1.5 rounded-md hover:bg-muted disabled:opacity-50' disabled>
        <ChevronRight className='h- w-4' animateOnHover />
      </button>
    </div>
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-10 w-16' />
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-10 w-20' />
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-10 w-12' />
      </div>
    </div>
    <Skeleton className='h-10 w-32 rounded-md ml-3' />
  </div>
);
