import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/modules/core/animate/base/DropdownMenu';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Button } from '@ui/modules/core/primitives/Button';
import { useState } from 'react';
import { Demo } from '../Demo';

export const DropdownMenuDemo = () => {
  const [lastAction, setLastAction] = useState('none yet');

  return (
    <Demo>
      <LazyMotionProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>Holiday actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setLastAction('edit')}>Edit holiday</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLastAction('duplicate')}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem disabled>Export (disabled)</DropdownMenuItem>
            <DropdownMenuItem variant='destructive' onClick={() => setLastAction('delete')}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <p className='m-0 font-mono text-sm'>Last action: {lastAction}</p>
      </LazyMotionProvider>
    </Demo>
  );
};
