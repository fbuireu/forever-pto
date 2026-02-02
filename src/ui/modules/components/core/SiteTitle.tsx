import { getTranslations } from 'next-intl/server';
import { GradientText } from 'src/components/animate-ui/primitives/texts/gradient';
import { OceanSunset } from './OceanSunset';
import { PalmTree } from './PalmTree';

export const SiteTitle = async () => {
  const t = await getTranslations('home');

  return (
    <div className='flex items-center flex-col justify-center mt-8'>
      <h1 className='text-4xl sm:text-5xl font-bold text-center leading-tight flex items-center gap-2'>
        Forever <span className='sr-only'>PTO</span>
        <GradientText text='P' className='tracking-wider -mr-7' gradient='var(--brand-gradient)' />
        <PalmTree width={60} height={60} animated gradientId='flowGradientTitle' className='inline-block' />
        <OceanSunset gradientId='flowGradientTitle' className='inline-block' />
      </h1>
      <p className='text-center text-muted-foreground mt-2'>{t('subtitle')}</p>
    </div>
  );
};
