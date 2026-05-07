const MONTHS = 12;
const DAYS_PER_WEEK = 7;
const DAYS_PER_GRID = 42;

const Bone = ({ className }: { className: string }) => (
  <div className={`rounded-[8px] bg-[var(--muted)] ${className}`} />
);

export const CalendarListFixture = () => (
  <div className='grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-5 mx-auto w-full'>
    {Array.from({ length: MONTHS }, (_, i) => (
      <div
        key={i}
        className='p-3 select-none rounded-[14px] border-[3px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-md)]'
      >
        <div className='flex justify-center items-center mb-4'>
          <Bone className='h-5 w-28' />
        </div>
        <div className='grid grid-cols-7 gap-1 mb-2'>
          {Array.from({ length: DAYS_PER_WEEK }, (_, j) => (
            <div key={j} className='h-8 w-8 flex items-center justify-center'>
              <Bone className='h-4 w-6' />
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7 gap-2'>
          {Array.from({ length: DAYS_PER_GRID }, (_, k) => (
            <Bone key={k} className='h-8 w-8 rounded-md' />
          ))}
        </div>
      </div>
    ))}
  </div>
);
