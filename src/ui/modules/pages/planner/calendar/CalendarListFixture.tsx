import { formatDate, getWeekdayNames } from '@ui/utils/dates';

const MONTH_KEYS = Array.from({ length: 12 }, (_, i) =>
  formatDate({ date: new Date(2024, i, 1), locale: 'en', format: 'MMMM' })
);
const WEEKDAY_KEYS = getWeekdayNames({ locale: 'en', weekStartsOn: 1 });
const DAY_KEYS = Array.from({ length: 42 }, (_, i) => `d${i + 1}`);

const Bone = ({ className }: { className: string }) => (
  <div className={`rounded-[8px] bg-[var(--muted)] ${className}`} />
);

export const CalendarListFixture = () => (
  <div className='grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-5 mx-auto w-full'>
    {MONTH_KEYS.map((month) => (
      <div
        key={month}
        className='p-3 select-none rounded-[14px] border-[3px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-md)]'
      >
        <div className='flex justify-center items-center mb-4'>
          <Bone className='h-5 w-28' />
        </div>
        <div className='grid grid-cols-7 gap-1 mb-2'>
          {WEEKDAY_KEYS.map((day) => (
            <div key={day} className='h-8 w-8 flex items-center justify-center'>
              <Bone className='h-4 w-6' />
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7 gap-2'>
          {DAY_KEYS.map((day) => (
            <Bone key={`${month}-${day}`} className='h-8 w-8 rounded-md' />
          ))}
        </div>
      </div>
    ))}
  </div>
);
