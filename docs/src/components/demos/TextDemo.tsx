import { RotatingText } from '@ui/modules/core/animate/text/Rotating';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Demo } from '../Demo';

const ROTATING_WORDS = ['vacations', 'holidays', 'long weekends', 'bridge days'];

export const RotatingTextDemo = () => (
  <LazyMotionProvider>
    <Demo>
      <p className='flex items-center gap-2 text-xl font-semibold'>
        Maximize your
        <RotatingText
          text={ROTATING_WORDS}
          duration={2000}
          className='font-display font-black text-[var(--color-brand-teal)]'
        />
      </p>
    </Demo>
  </LazyMotionProvider>
);
