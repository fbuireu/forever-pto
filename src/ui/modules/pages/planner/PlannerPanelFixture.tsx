import { ChevronLeft, ChevronRight } from 'lucide-react';

const Bone = ({ className }: { className: string }) => (
  <div className={`rounded-[8px] border-[2px] border-[var(--frame)]/30 bg-[var(--surface-panel-soft)] ${className}`} />
);

export const PlannerPanelFixture = () => (
  <div className='w-full rounded-[10px] border-[3px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-md)]'>
    <div className='flex flex-wrap items-center gap-3'>
      <div className='flex shrink-0 grow items-stretch overflow-hidden rounded-xl border-[3px] border-[var(--frame)] bg-[var(--surface-panel)]'>
        <div className='w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] border-r-[3px] border-[var(--frame)] opacity-50'>
          <ChevronLeft size={20} />
        </div>
        <div className='mx-2 flex w-25 grow flex-col items-center justify-center px-3 py-2 gap-1.5'>
          <Bone className='h-4 w-20' />
          <Bone className='h-3 w-16' />
        </div>
        <div className='w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] border-l-[3px] border-[var(--frame)] opacity-50'>
          <ChevronRight size={20} />
        </div>
      </div>
      <div className='flex flex-nowrap gap-x-2'>
        <Bone className='h-11 w-[120px] rounded-[10px]' />
        <Bone className='h-11 w-[120px] rounded-[10px]' />
      </div>
      <Bone className='h-11 w-32 grow rounded-[10px]' />
    </div>

    <div className='mt-3 border-t-[2px] border-[var(--frame)]/15' />
    <div className='pt-3'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4'>
          <Bone className='h-8 w-32 rounded-full' />
          <Bone className='h-8 w-28 rounded-full' />
          <div className='h-8 w-[2px] bg-[var(--frame)]/15' />
          <Bone className='h-10 w-36 rounded-full' />
        </div>
      </div>
      <div className='mt-3 space-y-2'>
        <Bone className='h-[22px] w-full rounded-full' />
        <Bone className='h-[22px] w-full rounded-full' />
      </div>
    </div>
  </div>
);
