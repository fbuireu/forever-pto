'use client';

import { Link } from '@application/i18n/navigation';
import { useIsMobile } from '@ui/hooks/useMobile';
import { useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import Image from 'next/image';

export function Logo() {
  const { state, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isOpen = state === 'expanded';
  const logoSize = isOpen || isMobile ? 40 : 36;

  return (
    <div className='w-full flex items-center justify-center group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:p-0 rounded-xl border-[3px] border-transparent'>
      <Link
        href='/'
        onClick={() => isMobile && setOpenMobile(false)}
        className='no-underline outline-none w-full p-3 flex justify-center hover:opacity-85 transition-opacity'
        aria-label='Forever PTO'
      >
        <div className='flex items-center gap-2'>
          {(isOpen || isMobile) && <p className='text-3xl font-display font-black tracking-tighter'>Forever</p>}
          <div
            className='bg-accent border-[3px] border-(--frame) rounded-[8px] shadow-(--shadow-brutal-xs) overflow-hidden shrink-0 -rotate-[4deg]'
            style={{ width: logoSize, height: logoSize }}
            aria-hidden='true'
          >
            <Image
              src='/static/images/forever-pto-logo.png'
              alt=''
              width={logoSize}
              height={logoSize}
              priority
              unoptimized
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
