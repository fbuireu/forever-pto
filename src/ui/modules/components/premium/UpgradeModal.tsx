'use client';

import { Button } from '@const/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@const/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Crown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock } from 'src/components/animate-ui/icons/lock';
import { z } from 'zod';

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

const createEmailSchema = (getMessage: (key: string) => string) =>
  z.object({
    email: z.email(getMessage('invalidEmail')).min(1, getMessage('emailRequired')),
  });

type EmailFormData = z.infer<ReturnType<typeof createEmailSchema>>;

export const UpgradeModal = ({ open, onClose, feature, onVerifyEmail, isLoading }: UpgradeModalProps) => {
  const t = useTranslations('upgrade');
  const [step, setStep] = useState<Step>(Step.INPUT);

  const emailSchema = useMemo(
    () => createEmailSchema((key: string) => t(key as 'invalidEmail' | 'emailRequired')),
    [t]
  );

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
      }, 5000);
    } else {
      form.setError('email', {
        type: 'manual',
        message: t('emailNotFoundError'),
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
            {t('premiumRequired')}
          </DialogTitle>
          <DialogDescription>
            <span className='block my-2'>
              <Lock className='w-4 h-4 inline mr-1' animateOnView loop />
              <strong>{feature}</strong> {t('featureRequiresPremium')}
            </span>
            <span className='block text-muted-foreground leading-relaxed'>{t('verifyDescription')}</span>
            <span className='block text-muted-foreground leading-relaxed my-2'>{t('considerDonating')}</span>
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
                    <FormLabel>{t('enterPremiumEmail')}</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        inputMode='email'
                        placeholder={t('emailPlaceholder')}
                        disabled={isLoading}
                        autoFocus
                        {...field}
                      />
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
                      {t('verifying')}
                    </>
                  ) : (
                    t('verifyAccess')
                  )}
                </Button>
                <Button type='button' variant='outline' onClick={handleClose} disabled={isLoading}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === Step.SUCCESS && (
          <div className='text-center space-y-4 py-4'>
            <Crown className='w-12 h-12 text-yellow-500 mx-auto animate-pulse' />
            <div>
              <h3 className='font-semibold text-green-600'>{t('accessGranted')}</h3>
              <p className='text-sm text-muted-foreground mt-1'>{t('welcomeToPremium')}</p>
            </div>
          </div>
        )}

        {step === Step.ERROR && (
          <div className='text-center space-y-4'>
            <AlertCircle className='w-12 h-12 text-destructive mx-auto' />
            <div>
              <h3 className='font-semibold'>{t('accessDenied')}</h3>
              <p className='text-sm text-muted-foreground mt-1'>{t('emailNotFound')}</p>
            </div>
            <div className='flex gap-2 pt-2'>
              <Button onClick={handleTryAgain} variant='outline' className='flex-1'>
                {t('tryAgain')}
              </Button>
              <Button onClick={handleClose} className='flex-1'>
                {t('close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
