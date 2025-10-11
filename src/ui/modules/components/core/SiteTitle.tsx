import { GradientText } from 'src/components/animate-ui/primitives/texts/gradient';
import { PalmTree } from './PalmTree';

export const SiteTitle = () => (
  <div className='flex items-center flex-col justify-center mt-8 mb-16'>
    <h1 className='text-4xl sm:text-5xl font-bold text-center leading-tight flex items-center gap-2'>
      Forever{' '}
      <GradientText
        text='P'
        className='tracking-wider -mr-7'
        gradient='linear-gradient(90deg, 
          #eab308 0%,  
          #14b8a6 20%,   
          #f97316 50%,  
          #a855f7 80%,   
          #eab308 100%   
        )'
      />
      <PalmTree width={60} height={60} animated gradientId='flowGradientTitle' className='inline-block' />
    </h1>
    <p className='text-center text-muted-foreground mt-2'>
      Your ultimate solution for managing paid time off. Don't work anymore
    </p>
  </div>
);
