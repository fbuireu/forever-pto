import { ArrowDown } from '@ui/modules/core/animate/icons/ArrowDown';
import { ArrowUp } from '@ui/modules/core/animate/icons/ArrowUp';
import { Check } from '@ui/modules/core/animate/icons/Check';
import { ChevronDown } from '@ui/modules/core/animate/icons/ChevronDown';
import { ChevronLeft } from '@ui/modules/core/animate/icons/ChevronLeft';
import { ChevronRight } from '@ui/modules/core/animate/icons/ChevronRight';
import { ChevronUpDown } from '@ui/modules/core/animate/icons/ChevronUpDown';
import { CircleCheckBig } from '@ui/modules/core/animate/icons/CircleCheckBig';
import { Clock } from '@ui/modules/core/animate/icons/Clock';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Lock } from '@ui/modules/core/animate/icons/Lock';
import { MapPin } from '@ui/modules/core/animate/icons/MapPin';
import { Moon } from '@ui/modules/core/animate/icons/Moon';
import { PanelLeftIcon } from '@ui/modules/core/animate/icons/PanelLeft';
import { Plus } from '@ui/modules/core/animate/icons/Plus';
import { Search } from '@ui/modules/core/animate/icons/Search';
import { Settings } from '@ui/modules/core/animate/icons/Settings';
import { SlidersHorizontal } from '@ui/modules/core/animate/icons/SlidersHorizontal';
import { Star } from '@ui/modules/core/animate/icons/Star';
import { Sun } from '@ui/modules/core/animate/icons/Sun';
import { Trash2 } from '@ui/modules/core/animate/icons/Trash2';
import { Users } from '@ui/modules/core/animate/icons/Users';
import { X } from '@ui/modules/core/animate/icons/X';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import type { ComponentType } from 'react';
import { Demo } from '../Demo';

type AnimatedIcon = ComponentType<{ size?: number }>;

// Exhaustive gallery: every icon module in src/ui/modules/core/animate/icons/
// is imported here by its real export name, so a renamed or removed icon in
// the app breaks `astro check` instead of silently dropping out of the docs.
const ICONS: ReadonlyArray<{ name: string; Icon: AnimatedIcon }> = [
  { name: 'ArrowDown', Icon: ArrowDown },
  { name: 'ArrowUp', Icon: ArrowUp },
  { name: 'Check', Icon: Check },
  { name: 'ChevronDown', Icon: ChevronDown },
  { name: 'ChevronLeft', Icon: ChevronLeft },
  { name: 'ChevronRight', Icon: ChevronRight },
  { name: 'ChevronUpDown', Icon: ChevronUpDown },
  { name: 'CircleCheckBig', Icon: CircleCheckBig },
  { name: 'Clock', Icon: Clock },
  { name: 'Lock', Icon: Lock },
  { name: 'MapPin', Icon: MapPin },
  { name: 'Moon', Icon: Moon },
  { name: 'PanelLeftIcon', Icon: PanelLeftIcon },
  { name: 'Plus', Icon: Plus },
  { name: 'Search', Icon: Search },
  { name: 'Settings', Icon: Settings },
  { name: 'SlidersHorizontal', Icon: SlidersHorizontal },
  { name: 'Star', Icon: Star },
  { name: 'Sun', Icon: Sun },
  { name: 'Trash2', Icon: Trash2 },
  { name: 'Users', Icon: Users },
  { name: 'X', Icon: X },
];

export const ICON_COUNT = ICONS.length;

export const IconsGalleryDemo = () => (
  <LazyMotionProvider>
    <Demo>
      {ICONS.map(({ name, Icon }) => (
        <AnimateIcon key={name} animateOnHover>
          <span className='flex w-28 cursor-pointer flex-col items-center gap-2 rounded-xl border-[3px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-xs)]'>
            <Icon size={28} />
            <code className='text-[11px] leading-none'>{name}</code>
          </span>
        </AnimateIcon>
      ))}
    </Demo>
  </LazyMotionProvider>
);

const tileClass =
  'flex w-40 flex-col items-center gap-2 rounded-xl border-[3px] border-[var(--frame)] bg-card p-3 shadow-[var(--shadow-brutal-xs)]';

export const IconTriggersDemo = () => (
  <LazyMotionProvider>
    <Demo>
      <AnimateIcon animate loop loopDelay={1200}>
        <span className={tileClass}>
          <Clock size={28} />
          <code className='text-[11px] leading-none'>animate loop</code>
        </span>
      </AnimateIcon>
      <AnimateIcon animateOnHover animation='path'>
        <span className={`${tileClass} cursor-pointer`}>
          <Settings size={28} />
          <code className='text-[11px] leading-none'>hover, path</code>
        </span>
      </AnimateIcon>
      <AnimateIcon animateOnTap>
        <span className={`${tileClass} cursor-pointer`}>
          <Star size={28} />
          <code className='text-[11px] leading-none'>animateOnTap</code>
        </span>
      </AnimateIcon>
      <AnimateIcon animateOnView animateOnViewOnce={false} delay={300}>
        <span className={tileClass}>
          <MapPin size={28} />
          <code className='text-[11px] leading-none'>animateOnView</code>
        </span>
      </AnimateIcon>
    </Demo>
  </LazyMotionProvider>
);
