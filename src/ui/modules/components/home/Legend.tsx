import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { cn } from '@const/lib/utils';
import { MODIFIERS_CLASS_NAMES } from '@ui/modules/components/core/utils/helpers';

export const Legend = () => {
  return (
    <section className='mt-8 text-center text-sm w-full max-w-4xl mx-auto'>
      <Card className='gap-4'>
        <CardHeader className='text-center'>
          <CardTitle className='text-3xl font-bold'>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-2 flex flex-wrap justify-center gap-4'>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.today)} />
              <span>Today</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.weekend)} />
              <span>Weekends</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.holiday)} />
              <span>Holidays</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.suggested)} />
              <span>Suggested</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.manuallySelected)} />
              <span>Manual</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.alternative, 'animate-none')} />
              <span>Alternatives</span>
            </div>
            <div className='flex items-center'>
              <div className={cn('mr-2 h-6 w-6 rounded-sm', MODIFIERS_CLASS_NAMES.custom)} />
              <span>Custom</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
