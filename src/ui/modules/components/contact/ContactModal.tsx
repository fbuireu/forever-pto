'use client';

import { type ContactFormData, createContactSchema } from '@application/dto/contact/schema';
import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@const/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@const/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { Textarea } from '@const/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { CircleCheckBig } from 'src/components/animate-ui/icons/circle-check-big';
import { useShallow } from 'zustand/react/shallow';
import { FormButtons } from '../core/FormButtons';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

const Step = {
  INPUT: 'input',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type Step = (typeof Step)[keyof typeof Step];

export const ContactModal = ({ open, onClose }: ContactModalProps) => {
  const t = useTranslations('contact');
  const tErrors = useTranslations('errors.contact');
  const tValidation = useTranslations('validation.contact');
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [isPending, startTransition] = useTransition();
  const { setEmail, userEmail } = usePremiumStore(
    useShallow((state) => ({
      setEmail: state.setEmail,
      userEmail: state.userEmail,
    }))
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  const contactSchema = createContactSchema({
    invalidEmail: tValidation('invalidEmail'),
    emailRequired: tValidation('emailRequired'),
    nameMin: tValidation('nameMin'),
    nameMax: tValidation('nameMax'),
    subjectMin: tValidation('subjectMin'),
    subjectMax: tValidation('subjectMax'),
    messageMin: tValidation('messageMin'),
    messageMax: tValidation('messageMax'),
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: userEmail ?? undefined,
    },
    values: {
      email: userEmail ?? '',
      name: '',
      subject: '',
      message: '',
    },
  });

  const handleClose = () => {
    onClose();
    setStep(Step.INPUT);
    form.reset();
    setErrorMessage('');
  };

  const onSubmit = (data: ContactFormData) => {
    startTransition(async () => {
      try {
        const { sendContactEmailAction } = await import('@infrastructure/actions/contact');
        const result = await sendContactEmailAction(data);
        setEmail(data.email);

        if (result.success) {
          setStep(Step.SUCCESS);
        } else {
          const translatedError = result.errorType
            ? tErrors(result.errorType as Parameters<typeof tErrors>[0])
            : result.error ?? t('failedToSend');
          setErrorMessage(translatedError);
          setStep(Step.ERROR);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t('failedToSend'));
        setStep(Step.ERROR);
      }
    });
  };

  const handleTryAgain = () => {
    setStep(Step.INPUT);
    setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Mail className='w-5 h-5 text-primary' />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        {step === Step.INPUT && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4' noValidate>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('namePlaceholder')} inputMode='text' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input type='email' inputMode='email' placeholder={t('emailPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='subject'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('subject')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('subjectPlaceholder')} inputMode='text' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('message')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('messagePlaceholder')}
                        className='min-h-30 resize-none field-sizing-content'
                        inputMode='text'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormButtons
                submitText={t('sendMessage')}
                loadingText={t('sending')}
                cancelText={t('cancel')}
                onCancel={handleClose}
                pending={isPending}
              />
            </form>
          </Form>
        )}

        {step === Step.SUCCESS && (
          <div className='text-center space-y-4 py-4'>
            <CircleCheckBig animateOnView loop loopDelay={2000} className='w-12 h-12 text-green-500 mx-auto' />
            <div>
              <h3 className='font-semibold text-green-600'>{t('successTitle')}</h3>
              <p className='text-sm text-muted-foreground mt-1'>{t('successDescription')}</p>
            </div>
          </div>
        )}

        {step === Step.ERROR && (
          <DialogFooter>
            <div className='text-center space-y-4 py-4'>
              <AlertCircle className='w-12 h-12 text-destructive mx-auto' />
              <div>
                <h3 className='font-semibold'>{t('errorTitle')}</h3>
                <p className='text-sm text-muted-foreground mt-1'>{errorMessage}</p>
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
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
