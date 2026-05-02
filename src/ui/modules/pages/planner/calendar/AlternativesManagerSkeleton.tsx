import { Skeleton } from '@ui/modules/core/primitives/Skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AlternativesManagerSkeleton = () => (
  <div className='sticky top-0 z-10 flex w-fit flex-wrap items-center gap-3 rounded-[14px] border-[3px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-md)]'>
    {/* navigation widget */}
    <div className='flex shrink-0 grow items-stretch overflow-hidden rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)]'>
      <button
        type='button'
        disabled
        className='w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] border-r-[3px] border-[var(--frame)] disabled:opacity-50'
      >
        <ChevronLeft size={20} />
      </button>
      <div className='mx-2 flex w-25 grow flex-col items-center justify-center px-3 py-2 gap-1.5'>
        <Skeleton className='h-4 w-20 rounded-md' />
        <Skeleton className='h-3 w-16 rounded-md' />
      </div>
      <button
        type='button'
        disabled
        className='w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] border-l-[3px] border-[var(--frame)] disabled:opacity-50'
      >
        <ChevronRight size={20} />
      </button>
    </div>

    <div className='flex flex-nowrap space-x-2'>
      <Skeleton className='h-11 w-[120px] rounded-[10px]' />
      <Skeleton className='h-11 w-[120px] rounded-[10px]' />
    </div>

    <Skeleton className='flex grow h-11 w-32 rounded-[10px]' />
  </div>
);
