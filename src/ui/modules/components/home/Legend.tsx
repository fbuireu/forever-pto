import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';

export const Legend = () => {
  return (
    <section className='mt-8 text-center text-sm w-full max-w-4xl mx-auto'>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold'>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-2 flex flex-wrap justify-center gap-4'>
            <div className='flex items-center'>
              <div className='mr-2 h-6 w-6 rounded-sm bg-accent border border-ring font-medium' />
              <span>Today</span>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-6 w-6 rounded-sm bg-muted/50 border border-muted' />
              <span>Weekends</span>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-6 w-6 rounded-sm bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-200 dark:border-yellow-300 shadow-sm' />
              <span>Holidays</span>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-6 w-6 rounded-sm bg-teal-400 dark:bg-teal-600 border-2 border-teal-300 dark:border-teal-400 shadow-md' />
              <span>Suggested</span>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-6 w-6 rounded-sm bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-400 shadow-md [background-image:repeating-linear-gradient(-45deg,transparent,transparent_2px,rgba(255,165,0,0.8)_2px,rgba(255,165,0,0.8)_4px)]' />
              <span>Alternatives</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
