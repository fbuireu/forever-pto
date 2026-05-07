import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/modules/core/primitives/Card';

const Bone = ({ className }: { className: string }) => (
  <div className={`rounded-[8px] bg-[var(--muted)] ${className}`} />
);

const CHART_KEYS_A = ['holidays-dist', 'quarter-dist'];
const CHART_KEYS_B = ['blocks-quarter', 'monthly-dist'];
const METRIC_KEYS = ['vacation-days', 'holidays', 'effective-days', 'multiplier'];
const COMPACT_KEYS = [
  'long-weekends',
  'vacation-periods',
  'day-off-ratio',
  'bridges-used',
  'workdays-month',
  'longest-vacation',
];
const YEAR_SUMMARY_KEYS = ['first-break', 'max-streak', 'last-break'];

export const SummaryFixture = () => (
  <div className='w-full max-w-4xl mx-auto space-y-6 z-1'>
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center flex-col gap-2 justify-between mx-auto mb-2'>
          <div className='flex items-center gap-2 text-center'>
            <Bone className='h-6 w-80' />
          </div>
          <div className='flex flex-wrap items-center gap-2 justify-center'>
            <Bone className='h-5 w-16 rounded-full' />
            <Bone className='h-5 w-20 rounded-full' />
            <Bone className='h-5 w-24 rounded-full' />
          </div>
        </CardTitle>
        <CardDescription className='space-y-2'>
          <div className='space-y-1'>
            <Bone className='h-4 w-full' />
            <Bone className='h-4 w-3/4' />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {CHART_KEYS_A.map((key) => (
            <div key={key} className='space-y-2'>
              <Bone className='h-6 w-32' />
              <Bone className='h-64 w-full rounded-[10px]' />
            </div>
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {CHART_KEYS_B.map((key) => (
            <div key={key} className='space-y-2'>
              <Bone className='h-6 w-32' />
              <Bone className='h-64 w-full rounded-[10px]' />
            </div>
          ))}
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {METRIC_KEYS.map((key) => (
            <div
              key={key}
              className='flex flex-col items-center p-4 bg-[var(--surface-panel-soft)] rounded-[10px] space-y-2'
            >
              <Bone className='h-3 w-16' />
              <div className='flex items-center gap-2'>
                <Bone className='w-4 h-4 rounded-sm' />
                <Bone className='h-6 w-8' />
              </div>
              <Bone className='h-4 w-12 rounded-full' />
            </div>
          ))}
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
          {COMPACT_KEYS.map((key) => (
            <div key={key} className='p-3 bg-[var(--surface-panel-soft)] rounded-[10px] text-center space-y-1'>
              <Bone className='w-4 h-4 mx-auto rounded-sm' />
              <Bone className='h-5 w-8 mx-auto' />
              <Bone className='h-3 w-12 mx-auto' />
            </div>
          ))}
        </div>
        <div className='p-4 bg-[var(--surface-panel-inset)] rounded-[10px] space-y-3'>
          <div className='flex items-center gap-2'>
            <Bone className='w-4 h-4 rounded-sm' />
            <Bone className='h-4 w-32' />
          </div>
          <div className='grid grid-cols-3 gap-4 text-center'>
            {YEAR_SUMMARY_KEYS.map((key) => (
              <div key={key} className='space-y-1'>
                <Bone className='h-3 w-20 mx-auto' />
                <Bone className='h-5 w-12 mx-auto' />
              </div>
            ))}
          </div>
          <div className='text-center space-y-1'>
            <Bone className='h-3 w-24 mx-auto' />
            <Bone className='h-6 w-16 mx-auto' />
            <Bone className='h-3 w-28 mx-auto' />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
