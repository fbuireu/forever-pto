import { CalendarListFixture } from '@ui/modules/pages/planner/calendar/CalendarListFixture';
import { PlannerPanelFixture } from '@ui/modules/pages/planner/PlannerPanelFixture';

const Bone = ({ className }: { className: string }) => (
  <div className={`rounded-[8px] border-[2px] border-[var(--frame)]/30 bg-[var(--surface-panel-soft)] ${className}`} />
);

export const PlannerSkeleton = () => (
  <div className='flex min-h-svh w-full' aria-hidden='true'>
    <div className='hidden md:flex flex-col gap-4 w-80 shrink-0 p-4'>
      <Bone className='h-11 w-full' />
      <Bone className='h-72 w-full' />
      <Bone className='h-44 w-full' />
    </div>
    <div className='flex-1 flex flex-col gap-6 p-4 md:p-8 max-w-8xl mx-auto w-full'>
      <div className='space-y-3'>
        <Bone className='h-9 w-2/3 max-w-md' />
        <Bone className='h-5 w-1/2 max-w-sm' />
      </div>
      <PlannerPanelFixture />
      <CalendarListFixture />
    </div>
  </div>
);
