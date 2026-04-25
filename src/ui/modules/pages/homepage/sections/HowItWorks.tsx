import { Badge } from '@ui/modules/core/primitives/Badge';
import { getTranslations } from 'next-intl/server';
import { brutCard } from './shared';

export const HowItWorks = async () => {
  const t = await getTranslations('landing');

  return (
    <section className='px-7 py-24' id='how'>
      <div className='max-w-[900px] mx-auto mb-14 text-center'>
        <div className='flex justify-center mb-4'>
          <Badge variant='outline'>{t('how.badge')}</Badge>
        </div>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] mb-4 text-[clamp(36px,5vw,64px)]'>
          {t('how.h2Start')} <em className='font-serif italic font-semibold'>&ldquo;{t('how.h2Q1')}&rdquo;</em>{' '}
          {t('how.h2Mid')} <em className='font-serif italic font-semibold'>&ldquo;{t('how.h2Q2')}&rdquo;</em>{' '}
          {t('how.h2End')}
        </h2>
        <p className='text-[19px] text-muted-foreground max-w-[640px] mx-auto'>{t('how.p')}</p>
      </div>

      <div className='max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-7'>
        {[
          {
            num: '1',
            bg: 'var(--color-brand-yellow)',
            iconBg: 'var(--color-brand-orange)',
            icon: '📥',
            title: t('how.step1Title'),
            desc: t('how.step1Desc'),
          },
          {
            num: '2',
            bg: 'var(--color-brand-teal)',
            iconBg: 'var(--color-brand-sky)',
            icon: '🧮',
            title: t('how.step2Title'),
            desc: t('how.step2Desc'),
          },
          {
            num: '3',
            bg: 'var(--color-brand-purple)',
            iconBg: 'var(--color-brand-pink)',
            icon: '📤',
            title: t('how.step3Title'),
            desc: t('how.step3Desc'),
          },
        ].map(({ num, bg, iconBg, icon, title, desc }) => (
          <div
            key={num}
            className={`${brutCard} px-7 pt-14 pb-7 relative transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[11px_11px_0_0_var(--frame)]`}
          >
            <div
              className='absolute -top-7 left-[22px] w-14 h-14 border-[4px] border-[var(--frame)] rounded-full grid place-items-center font-display font-extrabold text-[26px] shadow-[4px_4px_0_0_var(--frame)] text-[var(--frame)]'
              style={{ background: bg }}
            >
              {num}
            </div>
            <div
              className='w-16 h-16 border-[3px] border-[var(--frame)] rounded-[10px] grid place-items-center text-[32px] mb-4 mt-4 shadow-[3px_3px_0_0_var(--frame)]'
              style={{ background: iconBg }}
            >
              {icon}
            </div>
            <h3 className='font-display font-extrabold text-[26px] leading-[1.05] tracking-[-0.02em] mb-2.5'>
              {title}
            </h3>
            <p className='text-foreground text-[16px]'>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
