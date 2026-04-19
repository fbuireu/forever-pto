import { GradientText } from '@ui/components/animate/primitives/texts/gradient';
import { getTranslations } from 'next-intl/server';
import { OceanSunset } from './OceanSunset';
import { PalmTree } from './PalmTree';

export const SiteTitle = async () => {
  const t = await getTranslations('home');

  return (
    <div className='flex items-center flex-col justify-center mt-8 gap-4'>
      <h1 className='text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.06em] text-center leading-none flex items-center gap-2 rounded-[1.7rem] px-5 py-4 rotate-[-5deg]'>
        Forever <span className='sr-only'>PTO</span>
        <GradientText text='P' className='tracking-wider -mr-7' gradient='var(--brand-gradient)' />
        <PalmTree width={60} height={60} animated gradientId='flowGradientTitle' className='inline-block' />
        <OceanSunset gradientId='flowGradientTitle' className='inline-block' />
      </h1>
      <p className='max-w-3xl rounded-[1.3rem] border-[2.5px] border-(--frame) bg-(--surface-panel-soft) px-5 py-4 text-center text-sm font-medium text-muted-foreground shadow-[var(--shadow-brutal-md)] sm:text-base'>
        {t('subtitle')}
      </p>
    </div>
  );
};
