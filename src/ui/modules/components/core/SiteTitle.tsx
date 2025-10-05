import { GradientText } from 'src/components/animate-ui/primitives/texts/gradient';

export const SiteTitle = () => (
  <div className={'flex items-center flex-col justify-center mt-8 mb-16'}>
    <h1 className='text-4xl sm:text-5xl font-extrabold text-center leading-tight'>
      Forever{' '}
      <GradientText
        text='PTO'
        className='tracking-wider'
        gradient='linear-gradient(90deg, 
      #eab308 0%,  
      #14b8a6 20%,   
      #f97316 50%,  
      #a855f7 80%,   
      #eab308 100%   
    )'
      />
    </h1>
    <p className={'text-center text-muted-foreground mt-2'}>
      Your ultimate solution for managing paid time off. Don't work anymore
    </p>
  </div>
);
