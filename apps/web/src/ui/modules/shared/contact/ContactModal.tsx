'use client';

import {
  type ContactFormData,
  createContactSchema,
  MESSAGE_MIN_LENGTH,
  NAME_MIN_LENGTH,
  SUBJECT_MIN_LENGTH,
} from '@application/dto/contact/schema';
import { usePremiumStore } from '@application/stores/premium';
import { zodResolver } from '@hookform/resolvers/zod';
import { track } from '@infrastructure/clients/logging/better-stack/tracking';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@ui/modules/core/animate/base/Dialog';
import { CircleCheckBig } from '@ui/modules/core/animate/icons/CircleCheckBig';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@ui/modules/core/primitives/Form';
import { Input } from '@ui/modules/core/primitives/Input';
import { Textarea } from '@ui/modules/core/primitives/Textarea';
import { AlertCircle, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { FormButtons } from '../FormButtons';
import { Step, StepOutcome, StepOutcomeTone } from '../StepOutcome';
import { resolveApiErrorMessage } from '../utils/helpers';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export const ContactModal = ({ open, onClose }: ContactModalProps) => {
  const t = useTranslations('contact');
  const tErrors = useTranslations('errors');
  const tA11y = useTranslations('a11y');
  const tValidation = useTranslations('validation.contact');
  const tEmail = useTranslations('validation.email');
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
    invalidEmail: tEmail('invalid'),
    emailRequired: tEmail('required'),
    nameMin: tValidation('nameMin', { min: NAME_MIN_LENGTH }),
    nameMax: tValidation('nameMax'),
    subjectMin: tValidation('subjectMin', { min: SUBJECT_MIN_LENGTH }),
    subjectMax: tValidation('subjectMax'),
    messageMin: tValidation('messageMin', { min: MESSAGE_MIN_LENGTH }),
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

        if (result.success) {
          setEmail(data.email);
          track('contact_form_submitted');
          setStep(Step.SUCCESS);
        } else {
          setErrorMessage(
            resolveApiErrorMessage({ code: result.error, t, shared: tErrors, fallback: t('failedToSend') })
          );
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
      <DialogContent className='sm:max-w-lg' closeLabel={tA11y('closeDialog')}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            <span className='size-9 bg-[var(--accent)] border-[3px] border-[var(--frame)] rounded-[8px] shadow-[var(--shadow-brutal-3)] grid place-items-center shrink-0'>
              <Mail className='size-4' />
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
          <StepOutcome
            tone={StepOutcomeTone.SUCCESS}
            icon={<CircleCheckBig animateOnView className='size-8 text-[var(--color-brand-ink)]' />}
            title={t('successTitle')}
            description={t('successDescription')}
            onClose={handleClose}
          />
        )}

        {step === Step.ERROR && (
          <StepOutcome
            tone={StepOutcomeTone.ERROR}
            icon={<AlertCircle className='size-8 text-white' />}
            title={t('errorTitle')}
            description={errorMessage}
            onClose={handleClose}
            onTryAgain={handleTryAgain}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
