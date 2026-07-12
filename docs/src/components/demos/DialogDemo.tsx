import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Button } from '@ui/modules/core/primitives/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ui/modules/core/primitives/Dialog';
import { useState } from 'react';
import { Demo } from '../Demo';

export const DialogDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <Demo>
      <LazyMotionProvider>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset your plan?</DialogTitle>
              <DialogDescription>
                This clears every manually edited suggestion and recalculates from scratch.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={() => setOpen(false)}>
                Reset plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </LazyMotionProvider>
    </Demo>
  );
};

export const DialogNoCloseButtonDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant='outline'>Without close button</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No X in the corner</DialogTitle>
            <DialogDescription>Dismiss with Esc or by clicking the backdrop.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </LazyMotionProvider>
  </Demo>
);
