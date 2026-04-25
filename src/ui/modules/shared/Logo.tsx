'use client';

import { Link } from '@application/i18n/navigtion';
import { SidebarMenuButton, useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import { GradientText } from '@ui/modules/core/animate/primitives/texts/Gradient';
import { useIsMobile } from 'src/ui/hooks/useMobile';
import { OceanSunset } from './OceanSunset';
import { PalmTree } from './PalmTree';

export function Logo() {
  const { state, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isOpen = state === 'expanded';

  return (
    <SidebarMenuButton className='justify-center h-fit w-fit mx-auto rounded-[10px] bg-[var(--surface-panel)] px-3 py-3 shadow-[var(--shadow-brutal-sm)]'>
      <Link href='/' onClick={() => isMobile && setOpenMobile(false)}>
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
    </SidebarMenuButton>
  );
}
