import { Link } from '@application/i18n/navigation';
import { Button } from '@ui/modules/core/primitives/Button';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';

const CtaShapes = dynamic(() => import('./CtaShapes').then((m) => ({ default: m.CtaShapes })), { ssr: false });

export const HomepageCta = async () => {
  const t = await getTranslations('homepage');

  return (
    <section className='px-7 py-24 bg-[var(--frame)] text-[var(--background)] border-t-[4px] border-[var(--frame)] relative overflow-hidden'>
      <CtaShapes
        byeMonday={t('closing.shapes.byeMonday')}
        bossOff={t('closing.shapes.bossOff')}
        doNotDisturb={t('closing.shapes.doNotDisturb')}
        zeroRegrets={t('closing.shapes.zeroRegrets')}
      />

      <div className='max-w-[900px] mx-auto text-center relative z-[2]'>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] mb-5 text-[clamp(40px,6vw,80px)]'>
          {t('closing.titleStart')}{' '}
          <em className='font-serif italic text-[var(--accent)]'>{t('closing.titleEmphasis')}</em>
          <br />
          {t('closing.titleEnd')}
        </h2>
        <p className='text-[19px] opacity-85 mb-8'>{t('closing.description')}</p>
        <Button
          variant='accent'
          size='lg'
          asChild
          className='shadow-[var(--shadow-brutal-btn-inverted)] hover:shadow-[var(--shadow-brutal-btn-inverted-hover)] active:shadow-[var(--shadow-brutal-btn-inverted-active)]'
        >
          <Link href='/planner'>{t('closing.cta')}</Link>
        </Button>
      </div>
    </section>
  );
};
