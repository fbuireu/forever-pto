import { Skeleton } from '@const/components/ui/skeleton';

const MONTHS_PER_YEAR = 12;
const DAYS_PER_WEEK = 7;
const DAYS_PER_CALENDAR_GRID = 42;

export const CalendarListSkeleton = () => (
  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'>
    {Array.from({ length: MONTHS_PER_YEAR }).map(() => (
      <div
        key={crypto.randomUUID()}
        className='calendar-container p-3 w-fit select-none rounded-xl border bg-card shadow-sm'
      >
        <div className='flex justify-center items-center mb-4'>
          <Skeleton className='h-5 w-28' />
        </div>
        <div className='grid grid-cols-7 gap-1 mb-2'>
          {Array.from({ length: DAYS_PER_WEEK }).map(() => (
            <div key={crypto.randomUUID()} className='h-8 w-8 flex items-center justify-center'>
              <Skeleton className='h-4 w-6' />
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7 gap-2'>
          {Array.from({ length: DAYS_PER_CALENDAR_GRID }).map(() => (
            <div key={crypto.randomUUID()} className='calendar-day rounded-md relative h-8 w-8 p-0'>
              <Skeleton className='h-8 w-8 rounded-md' />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
