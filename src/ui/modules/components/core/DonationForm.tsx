'use client';

import type { CreatePaymentInput } from '@application/dto/payment/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@const/components/ui/input-group';
import { Label } from '@const/components/ui/label';
import { cn } from '@const/lib/utils';
import { amountFormatter } from '@shared/utils/helpers';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { ChevronDown } from 'src/components/animate-ui/icons/chevron-down';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { FormButtons } from './FormButtons';

const PRESET_AMOUNTS = [5, 10, 15] as const;

interface DonationFormProps {
  form: UseFormReturn<CreatePaymentInput>;
  onSubmit: (data: CreatePaymentInput) => void;
  currentAmount: number;
  locale: string;
  currency: string;
  currencySymbol: string;
  isPending?: boolean;
}

export function DonationForm({
  form,
  onSubmit,
  currentAmount,
  locale,
  currency,
  currencySymbol,
  isPending,
}: Readonly<DonationFormProps>) {
  const t = useTranslations('donationForm');
  const [showPromoCode, setShowPromoCode] = useState(false);
  const { setValue } = form;
  const { pending } = useFormStatus();
  const loading = pending || isPending;

  const amount = useMemo(() => amountFormatter(locale), [locale]);

  const handlePresetClick = useCallback(
    (value: number) => {
      setValue('amount', value, { shouldValidate: true });
    },
    [setValue]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className='grid gap-3'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder={t('emailPlaceholder')}
                  disabled={pending}
                  {...field}
                  className='h-10'
                  autoComplete='email'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='space-y-2'>
          <Label>{t('quickAmounts')}</Label>
          <div className='flex gap-2'>
            {PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                type='button'
                variant={currentAmount === preset ? 'default' : 'outline'}
                size='sm'
                onClick={() => handlePresetClick(preset)}
                disabled={loading}
                className='flex-1'
              >
                {amount.format(preset)}
              </Button>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name='amount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('donationAmount')}</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>{currencySymbol}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type='number'
                    placeholder={t('enterAmount')}
                    step='1'
                    min='1'
                    max='10000'
                    disabled={loading}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : parseFloat(value));
                    }}
                  />
                </InputGroup>
              </FormControl>
              <p className='text-xs text-muted-foreground mt-1'>
                {t('basePriceNote', { currency })}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible open={showPromoCode} onOpenChange={setShowPromoCode}>
          <CollapsibleTrigger className='flex items-center justify-between w-full p-2 text-sm font-medium hover:bg-muted/50 cursor-pointer rounded-md transition-colors'>
            <span className='text-muted-foreground'>{t('havePromoCode')}</span>
            <ChevronDown
              animateOnHover
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                showPromoCode && 'rotate-180'
              )}
              aria-hidden='true'
            />
          </CollapsibleTrigger>
          {showPromoCode && (
            <CollapsibleContent className='pt-2 min-h-15'>
              <FormField
                control={form.control}
                name='promoCode'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder={t('promoCodePlaceholder')}
                        disabled={loading}
                        {...field}
                        className='h-10 uppercase'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          )}
        </Collapsible>
        <FormButtons
          submitText={t('continueToPayment')}
          loadingText={t('processing')}
          hideCancel
          submitClassName='w-full bg-green-600 hover:bg-green-700'
          pending={loading}
        />
      </form>
    </Form>
  );
}
