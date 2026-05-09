'use client';

import { Link } from '@application/i18n/navigation';
import { useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import Image from 'next/image';
import { useIsMobile } from 'src/ui/hooks/useMobile';

export function Logo() {
  const { state, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isOpen = state === 'expanded';

  return (
    <div className='flex justify-center mx-auto px-3 py-3 rounded-[10px] border-[3px] border-transparent transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--frame)] hover:shadow-[var(--shadow-brutal-xs)]'>
      <Link href='/' onClick={() => isMobile && setOpenMobile(false)} className='no-underline outline-none'>
        <div className='flex items-center gap-2'>
          {(isOpen || isMobile) && <p className='text-3xl font-display font-black tracking-[-0.05em]'>Forever</p>}
          <div
            className='bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[var(--shadow-brutal-xs)] overflow-hidden shrink-0'
            style={{
              width: isOpen || isMobile ? 40 : 32,
              height: isOpen || isMobile ? 40 : 32,
            }}
            aria-hidden
          >
            <Image
              src='/static/images/forever-pto-logo.png'
              alt=''
              width={isOpen || isMobile ? 40 : 32}
              height={isOpen || isMobile ? 40 : 32}
              priority
              unoptimized
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
