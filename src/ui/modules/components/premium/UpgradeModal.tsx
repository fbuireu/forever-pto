'use client';

import { Button } from '@const/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@const/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Crown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Lock } from 'src/components/animate-ui/icons/lock';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  onVerifyEmail: (email: string) => Promise<boolean>;
  isLoading: boolean;
}

const Step = {
  INPUT: 'input',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type Step = (typeof Step)[keyof typeof Step];

const emailSchema = z.object({
  email: z.email('Please enter a valid email address').min(1, 'Email is required'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export const UpgradeModal = ({ open, onClose, feature, onVerifyEmail, isLoading }: UpgradeModalProps) => {
  const [step, setStep] = useState<Step>(Step.INPUT);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleClose = () => {
    form.reset();
    setStep(Step.INPUT);
    onClose();
  };

  const onSubmit = async (data: EmailFormData) => {
    const success = await onVerifyEmail(data.email);

    if (success) {
      setStep(Step.SUCCESS);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      form.setError('email', {
        type: 'manual',
        message: 'Email not found in our premium users list',
      });
      setStep(Step.ERROR);
    }
  };

  const handleTryAgain = () => {
    setStep(Step.INPUT);
    form.clearErrors();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Crown className='w-5 h-5 text-yellow-500' />
            Premium Feature Required
          </DialogTitle>
          <DialogDescription>
            <span className='block my-2'>
              <Lock className='w-4 h-4 inline mr-1' animateOnHover />
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4' noValidate>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter your premium email</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='your@email.com' disabled={isLoading} autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
          </Form>
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

        {step === Step.ERROR && (
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
