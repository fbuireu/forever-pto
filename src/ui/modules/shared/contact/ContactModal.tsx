'use client';

import { type ContactFormData, createContactSchema } from '@application/dto/contact/schema';
import { usePremiumStore } from '@application/stores/premium';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheckBig } from '@ui/modules/core/animate/icons/CircleCheckBig';
import { Button } from '@ui/modules/core/primitives/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@ui/modules/core/primitives/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@ui/modules/core/primitives/Form';
import { Input } from '@ui/modules/core/primitives/Input';
import { Textarea } from '@ui/modules/core/primitives/Textarea';
import { AlertCircle, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { FormButtons } from '../FormButtons';

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
            : (result.error ?? t('failedToSend'));
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
          <DialogTitle className='flex items-center gap-3'>
            <span className='w-9 h-9 bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[3px_3px_0_0_var(--frame)] grid place-items-center shrink-0'>
              <Mail className='w-4 h-4' />
            </span>
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
                    <FormLabel className='font-mono text-[11px] font-bold tracking-[0.1em] uppercase'>
                      {t('name')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('namePlaceholder')} inputMode='text' autoComplete='name' {...field} />
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
                    <FormLabel className='font-mono text-[11px] font-bold tracking-[0.1em] uppercase'>
                      {t('email')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        inputMode='email'
                        placeholder={t('emailPlaceholder')}
                        autoComplete='email'
                        {...field}
                      />
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
                    <FormLabel className='font-mono text-[11px] font-bold tracking-[0.1em] uppercase'>
                      {t('subject')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('subjectPlaceholder')} inputMode='text' autoComplete='off' {...field} />
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
                    <FormLabel className='font-mono text-[11px] font-bold tracking-[0.1em] uppercase'>
                      {t('message')}
                    </FormLabel>
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
          <div className='flex flex-col items-center gap-5 py-4'>
            <div className='w-16 h-16 bg-[var(--color-brand-teal)] border-[3px] border-[var(--frame)] rounded-[14px] shadow-[5px_5px_0_0_var(--frame)] grid place-items-center'>
              <CircleCheckBig animateOnView className='w-8 h-8 text-[var(--color-brand-ink)]' />
            </div>
            <div className='text-center'>
              <span className='inline-flex items-center gap-2 bg-[var(--color-brand-teal)] border-[2px] border-[var(--frame)] rounded-[6px] px-3 py-1 font-mono text-[11px] font-bold tracking-[0.12em] uppercase mb-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-[var(--color-brand-ink)]' />
                {t('successTitle')}
              </span>
              <p className='text-sm text-muted-foreground'>{t('successDescription')}</p>
            </div>
            <Button variant='outline' size='sm' onClick={handleClose}>
              {t('close')}
            </Button>
          </div>
        )}

        {step === Step.ERROR && (
          <div className='flex flex-col items-center gap-5 py-4'>
            <div className='w-16 h-16 bg-destructive border-[3px] border-[var(--frame)] rounded-[14px] shadow-[5px_5px_0_0_var(--frame)] grid place-items-center'>
              <AlertCircle className='w-8 h-8 text-white' />
            </div>
            <div className='text-center'>
              <span className='inline-flex items-center gap-2 bg-destructive text-white border-[2px] border-[var(--frame)] rounded-[6px] px-3 py-1 font-mono text-[11px] font-bold tracking-[0.12em] uppercase mb-3'>
                <span className='w-1.5 h-1.5 rounded-full bg-white' />
                {t('errorTitle')}
              </span>
              <p className='text-sm text-muted-foreground'>{errorMessage}</p>
            </div>
            <div className='flex gap-2 w-full'>
              <Button variant='outline' onClick={handleTryAgain} className='flex-1'>
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
