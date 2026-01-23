import { Skeleton } from '@const/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AlternativesManagerSkeleton = () => (
  <div className='sticky top-0 z-10 flex w-fit flex-wrap items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm'>
    <div className='flex shrink-0 items-center rounded-lg bg-muted/50 px-2 grow'>
      <button className='p-2 rounded-md disabled:opacity-50' disabled>
        <ChevronLeft size={20} />
      </button>
      <div className='mx-2 flex flex-col items-center relative w-25 grow'>
        <Skeleton className='h-5 w-20 rounded-md' />
        <Skeleton className='h-3 w-24 rounded-md mt-1' />
      </div>
      <button className='p-2 rounded-md disabled:opacity-50' disabled>
        <ChevronRight size={20} />
      </button>
    </div>

    <div className='flex flex-nowrap space-x-2'>
      <Skeleton className='h-10 w-[120px] rounded-lg' />
      <Skeleton className='h-10 w-[120px] rounded-lg' />
    </div>

    <Skeleton className='flex grow h-10 w-32 rounded-lg' />
  </div>
);
