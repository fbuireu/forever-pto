const Bone = ({ className }: { className: string }) => (
  <div className={`border-[2px] border-[var(--frame)]/30 bg-[var(--surface-panel-soft)] ${className}`} />
);

export const PtoStatusFixture = () => (
  <div className='rounded-[14px] border-[3px] border-[var(--frame)] bg-card px-4 py-3 shadow-[var(--shadow-brutal-lg)]'>
    <div className='flex items-center justify-between flex-wrap gap-4 h-full'>
      <div className='flex items-center gap-4'>
        <Bone className='h-8 w-32 rounded-full' />
        <Bone className='h-8 w-28 rounded-full' />
        <div className='h-8 w-[2px] bg-border' />
        <Bone className='h-10 w-36 rounded-full' />
      </div>
    </div>
  </div>
);
