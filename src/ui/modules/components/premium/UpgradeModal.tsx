'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@const/components/ui/dialog';
import { Input } from '@const/components/ui/input';
import { Label } from '@const/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Crown, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { z } from 'zod';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  onVerifyEmail: (email: string) => Promise<boolean>;
  isLoading: boolean;
}

const enum Step {
  INPUT = 'input',
  SUCCESS = 'success',
  ERROR = 'error',
}

const emailSchema = z.object({
  email: z.email('Please enter a valid email address').min(1, 'Email is required'),
});

export const UpgradeModal = ({ open, onClose, feature, onVerifyEmail, isLoading }: UpgradeModalProps) => {
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [verificationError, setVerificationError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleClose = () => {
    reset();
    setVerificationError('');
    setStep(Step.INPUT);
    onClose();
  };
  const onSubmit = async (data: z.infer<typeof emailSchema>) => {
    setVerificationError('');

    const success = await onVerifyEmail(data.email);

    if (success) {
      setStep(Step.SUCCESS);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setStep(Step.ERROR);
      setVerificationError('Email not found in our premium users list');
    }
  };

  const handleTryAgain = () => {
    setStep(Step.INPUT);
    setVerificationError('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Crown className='w-5 h-5 text-yellow-500' />
            Premium Feature Required
          </DialogTitle>
          <DialogDescription>
            <span className='block my-2'>
              <Lock className='w-4 h-4 inline mr-1' />
              <strong>{feature}</strong> requires premium access
            </span>
            <span className='block text-muted-foreground leading-relaxed'>
              Don&apos;t worry, if you already donate we will check your email against our list and grant you premium
              access. If you encounter any trouble please don&apos;t hesitate to contact us.
            </span>
            <span className='block text-muted-foreground leading-relaxed my-2'>
              If you haven&apos;t donated yet, please consider doing so to support the project and unlock premium
              features!
            </span>
          </DialogDescription>
        </DialogHeader>
        {step === Step.INPUT && (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>
            <div className='space-y-2'>
              <Label htmlFor='email'>Enter your premium email</Label>
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                disabled={isLoading}
                autoFocus
                {...register('email')}
              />
              {errors.email && <p className='text-sm text-destructive mt-1'>{errors.email.message}</p>}
              {verificationError && <p className='text-sm text-destructive mt-1'>{verificationError}</p>}
            </div>

            <div className='flex gap-2'>
              <Button type='submit' disabled={isLoading} className='flex-1'>
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  'Verify Access'
                )}
              </Button>
              <Button type='button' variant='outline' onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        )}
        {step === Step.SUCCESS && (
          <div className='text-center space-y-4 py-4'>
            <Crown className='w-12 h-12 text-yellow-500 mx-auto animate-pulse' />
            <div>
              <h3 className='font-semibold text-green-600'>Access Granted!</h3>
              <p className='text-sm text-muted-foreground mt-1'>Welcome to premium features.</p>
            </div>
          </div>
        )}
        {step === 'error' && (
          <div className='text-center space-y-4'>
            <AlertCircle className='w-12 h-12 text-destructive mx-auto' />
            <div>
              <h3 className='font-semibold'>Access Denied</h3>
              <p className='text-sm text-muted-foreground mt-1'>This email is not in our premium users list.</p>
            </div>
            <div className='flex gap-2 pt-2'>
              <Button onClick={handleTryAgain} variant='outline' className='flex-1'>
                Try Again
              </Button>
              <Button onClick={handleClose} className='flex-1'>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
