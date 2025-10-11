'use client';

import { GradientText } from 'src/components/animate-ui/primitives/texts/gradient';
import { SidebarMenuButton, useSidebar } from 'src/components/animate-ui/radix/sidebar';
import { PalmTree } from './PalmTree';

export function Logo() {
  const { state } = useSidebar();
  const isOpen = state === 'expanded';

  return (
    <SidebarMenuButton className={'justify-center h-fit'}>
      <div className='flex items-center'>
        {isOpen && (
          <div className='flex text-center justify-center gap-2'>
            <p className='text-3xl font-bold'>Forever</p>
            <p className='text-3xl font-bold -mr-3'>
              <GradientText
                text='P'
                gradient='linear-gradient(90deg, 
          #eab308 0%,  
          #14b8a6 20%,   
          #f97316 50%,  
          #a855f7 80%,   
          #eab308 100%    
        )'
              />
            </p>
          </div>
        )}
        <PalmTree width={isOpen ? 40 : 30} height={isOpen ? 40 : 30} gradientId='flowGradientLogo' />
      </div>
    </SidebarMenuButton>
  );
}
