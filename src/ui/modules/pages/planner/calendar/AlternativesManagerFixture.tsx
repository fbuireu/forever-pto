import { ChevronLeft, ChevronRight } from 'lucide-react';

const Bone = ({ className }: { className: string }) => (
  <div className={`rounded-[8px] bg-[var(--muted)] ${className}`} />
);

export const AlternativesManagerFixture = () => (
  <div className='sticky top-0 z-10 flex w-fit flex-wrap items-center gap-3 rounded-[14px] border-[3px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-md)]'>
    <div className='flex shrink-0 grow items-stretch overflow-hidden rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)]'>
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
    <div className='flex flex-nowrap space-x-2'>
      <Bone className='h-11 w-[120px] rounded-[10px]' />
      <Bone className='h-11 w-[120px] rounded-[10px]' />
    </div>
    <Bone className='h-11 w-32 grow rounded-[10px]' />
  </div>
);
