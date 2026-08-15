import { Badge } from '@ui/modules/core/primitives/Badge';
import { Button } from '@ui/modules/core/primitives/Button';
import { Demo } from '../Demo';

/**
 * Anatomy of the brutal language rendered with the real app primitives:
 * hard border, offset shadow, hover lift, and a rotated accent.
 */
export const PhilosophyDemo = () => (
  <Demo>
    <Button variant='accent'>Hover for the lift</Button>
    <Badge>Hard border</Badge>
    <div className='rotate-[-2deg] rounded-[8px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-black shadow-[var(--shadow-brutal-md)]'>
      Rotated accent
    </div>
  </Demo>
);
