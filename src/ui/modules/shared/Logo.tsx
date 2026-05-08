'use client';

import { Link } from '@application/i18n/navigtion';
import { useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import { GradientText } from '@ui/modules/core/animate/primitives/texts/Gradient';
import { useIsMobile } from 'src/ui/hooks/useMobile';
import { OceanSunset } from './OceanSunset';
import { PalmTree } from './PalmTree';

export function Logo() {
  const { state, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isOpen = state === 'expanded';

  return (
    <div className='flex justify-center mx-auto px-3 py-3 rounded-[10px] border-[3px] border-transparent transition-[transform,filter] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--frame)] hover:[filter:var(--drop-shadow-brutal-xs)]'>
      <Link href='/' onClick={() => isMobile && setOpenMobile(false)} className='no-underline outline-none'>
        <div className='flex items-center'>
          {(isOpen || isMobile) && (
            <div className='flex text-center justify-center gap-2'>
              <p className='text-3xl font-display font-black tracking-[-0.05em]'>Forever</p>
              <p className='text-3xl font-display font-black -mr-3 tracking-[-0.05em]'>
                <GradientText text='P' gradient='var(--brand-gradient)' />
              </p>
            </div>
          )}
          <PalmTree width={isOpen ? 40 : 30} height={isOpen ? 40 : 30} gradientId='flowGradientLogo' />
          <OceanSunset
            width={isOpen ? 20 : 15}
            height={isOpen ? 20 : 15}
            gradientId='flowGradientTitle'
            className={'inline-block right-0'}
          />
        </div>
      </Link>
    </div>
  );
}
