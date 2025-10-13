import { generateMetadata } from './metadata';

export const runtime = 'edge';

const ForeverPto = async () => {
  return (
      <div className='grid min-h-screen grid-rows-[auto_1fr_auto] gap-8 p-4 sm:p-2'>
        <div className='flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6'>
          <div className='relative'>
            <div className='absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-2xl opacity-20 animate-pulse'></div>
            <div className='relative bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'>
              <h1 className='text-4xl md:text-6xl font-extrabold tracking-tight'>🚀 Coming Soon</h1>
            </div> 
          </div>
          <div className='max-w-2xl space-y-4'>
            <p className='text-xl md:text-2xl text-muted-foreground'>We're cooking up something amazing!</p>
            <p className='text-lg text-muted-foreground'>
              Forever PTO is being carefully crafted to help you maximize your vacation days. Stay tuned for the
              ultimate PTO optimization tool! 🌴
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 mt-8'>
            <div className='bg-card border rounded-xl p-6 text-center'>
              <div className='text-2xl mb-2'>📅</div>
              <h3 className='font-semibold'>Smart Planning</h3>
              <p className='text-sm text-muted-foreground'>Vacation and PTO optimization</p>
            </div>
            <div className='bg-card border rounded-xl p-6 text-center'>
              <div className='text-2xl mb-2'>🌍</div>
              <h3 className='font-semibold'>Global Holidays</h3>
              <p className='text-sm text-muted-foreground'>Support for 150+ countries</p>
            </div>
            <div className='bg-card border rounded-xl p-6 text-center'>
              <div className='text-2xl mb-2'>💎</div>
              <h3 className='font-semibold'>Premium Features</h3>
              <p className='text-sm text-muted-foreground'>Advanced analytics & insights</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ForeverPto;
export { generateMetadata };
