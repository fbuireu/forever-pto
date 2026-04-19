import { Badge } from '@ui/components/primitives/badge';
import { getTranslations } from 'next-intl/server';
import { brutCard } from './landing-shared';

const AVATAR_BG = ['bg-[var(--color-brand-teal)]', 'bg-[var(--color-brand-orange)]', 'bg-[var(--color-brand-purple)]'] as const;
const ROTATES = ['rotate-[-1deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]'] as const;

export const LandingTestimonials = async () => {
  const t = await getTranslations('landing');

  return (
    <section className='px-7 py-24' id='testimonials'>
      <div className='max-w-[900px] mx-auto mb-14 text-center'>
        <div className='flex justify-center mb-4'>
          <Badge variant='outline'>{t('testimonials.badge')}</Badge>
        </div>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] text-[clamp(36px,5vw,64px)]'>
          {t('testimonials.h2Start')} <em className='font-serif italic font-semibold'>{t('testimonials.h2Em')}</em> {t('testimonials.h2End')}
        </h2>
      </div>

      <div className='max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
        {([0, 1, 2] as const).map((idx) => {
          const text = t(`testimonials.items.${idx}.text` as Parameters<typeof t>[0]);
          const name = t(`testimonials.items.${idx}.name` as Parameters<typeof t>[0]);
          const role = t(`testimonials.items.${idx}.role` as Parameters<typeof t>[0]);

          return (
            <div
              key={idx}
              className={`${brutCard} p-6 relative ${ROTATES[idx]} hover:rotate-0 transition-transform duration-200`}
            >
              <span
                className='absolute -top-3.5 left-[18px] bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] px-2.5 font-serif text-[36px] leading-none shadow-[3px_3px_0_0_var(--frame)] rotate-[-5deg]'
                aria-hidden='true'
              >&quot;</span>
              <div className='text-[#FFB800] tracking-[2px] text-sm mt-2 mb-2.5'>★★★★★</div>
              <p className='font-serif text-[22px] leading-[1.3] mb-4'>{text}</p>
              <div className='flex gap-3 items-center pt-3.5 border-t-[2.5px] border-[var(--frame)]'>
                <div
                  className={`w-[42px] h-[42px] rounded-full border-[3px] border-[var(--frame)] grid place-items-center font-display font-extrabold text-white shrink-0 ${AVATAR_BG[idx]}`}
                >
                  {name[0]}
                </div>
                <div>
                  <strong className='block font-bold text-[15px]'>{name}</strong>
                  <span className='font-mono text-[11px] text-muted-foreground'>{role}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
