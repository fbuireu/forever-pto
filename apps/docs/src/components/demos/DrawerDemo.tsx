import { Drawer, DrawerContent, DrawerTitle } from '@ui/modules/core/animate/base/Drawer';
import { Button } from '@ui/modules/core/primitives/Button';
import { useState } from 'react';
import { Demo } from '../Demo';

export const DrawerDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <Demo>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerTitle>Demo drawer</DrawerTitle>
          <div className='mx-auto w-full max-w-md space-y-3 p-6 pb-10 text-sm'>
            <p className='m-0 font-bold'>A vaul bottom sheet</p>
            <p className='m-0 text-muted-foreground'>
              Drag the handle down or tap the overlay to dismiss. On the app it hosts mobile-friendly flows like the
              cookie preferences.
            </p>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </Demo>
  );
};
