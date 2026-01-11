'use client';

import { useIsMobile } from '@const/hooks/use-mobile';
import { GradientText } from 'src/components/animate-ui/primitives/texts/gradient';
import { SidebarMenuButton, useSidebar } from 'src/components/animate-ui/radix/sidebar';
import { OceanSunset } from './OceanSunset';
import { PalmTree } from './PalmTree';

export function Logo() {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const isOpen = state === 'expanded';

  return (
    <SidebarMenuButton className={'justify-center h-fit'}>
      <div className='flex items-center'>
        {(isOpen || isMobile) && (
          <div className='flex text-center justify-center gap-2'>
            <p className='text-3xl font-bold'>Forever</p>
            <p className='text-3xl font-bold -mr-3'>
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
    </SidebarMenuButton>
  );
}
