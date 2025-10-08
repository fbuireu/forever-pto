'use client';

import { DiscountInfo } from '@application/dto/payment/types';
import { usePremiumStore } from '@application/stores/premium';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@const/components/ui/input-group';
import { Label } from '@const/components/ui/label';
import { cn } from '@const/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStripeClient } from '@infrastructure/payments/stripe/client';
import { initializePayment } from '@infrastructure/services/payments/checkout';
import { calculateFinalAmount, formatDiscountMessage } from '@infrastructure/services/payments/utils/helpers';
import { amountFormatter } from '@shared/utils/helpers';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';
import * as z from 'zod';
import { useShallow } from 'zustand/react/shallow';
import PaymentForm from './PaymentForm';
import { ChevronDown } from 'src/components/animate-ui/icons/chevron-down';
import { Star } from 'src/components/animate-ui/icons/star';

const donationSchema = z.object({
  amount: z
    .number({ error: 'Amount must be a number' })
    .min(0.01, 'Amount must be at least 1')
    .max(10000, 'Amount cannot exceed 10,000')
    .multipleOf(0.01, 'Amount must have maximum 2 decimal places'),
  email: z.email('Please enter a valid email address').min(1, 'Email is required'),
  promoCode: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

const PRESET_AMOUNTS = [5, 10, 15] as const;

interface PaymentState {
  clientSecret: string;
  data: DonationFormData;
  discountInfo: DiscountInfo | null;
}

const stripeClient = getStripeClient();

export const Donate = () => {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);

  const { premiumKey, setPremiumStatus, userEmail, setEmail, getCurrencyFromLocale, currency, currencySymbol } =
    usePremiumStore(
      useShallow((state) => ({
        premiumKey: state.premiumKey,
        setPremiumStatus: state.setPremiumStatus,
        userEmail: state.userEmail,
        setEmail: state.setEmail,
        getCurrencyFromLocale: state.getCurrencyFromLocale,
        currency: state.currency,
        currencySymbol: state.currencySymbol,
      }))
    );

  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    values: {
      amount: 5,
      promoCode: '',
      email: userEmail ?? '',
    },
  });

  const { watch, setValue } = form;
  const currentAmount = watch('amount');

  const amount = useMemo(() => amountFormatter(locale), [locale]);

  const handlePresetClick = useCallback(
    (value: number) => {
      setValue('amount', value, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = useCallback(
    async (data: DonationFormData) => {
      startTransition(async () => {
        try {
          setEmail(data.email);
          const result = await initializePayment({
            amount: data.amount,
            email: data.email,
            promoCode: data.promoCode,
          });

          if (result.discountInfo) {
            const message = formatDiscountMessage(result.discountInfo);
            toast.success(message.title, {
              description: message.description,
            });
          }

          setPaymentState({
            clientSecret: result.clientSecret,
            data,
            discountInfo: result.discountInfo || null,
          });
        } catch (error) {
          toast.error('Payment initialization failed', {
            description: error instanceof Error ? error.message : 'Please try again.',
          });
        }
      });
    },
    [setEmail]
  );

  const handlePaymentSuccess = useCallback(() => {
    if (!paymentState) return;

    setPremiumStatus({
      email: paymentState.data.email,
      premiumKey: paymentState.clientSecret,
    });

    toast.success('Payment successful!', {
      description: 'Thank you for your support! You now have premium access.',
    });

    form.reset();
    setPaymentState(null);
    setShowPromoCode(false);
    setIsOpen(false);
  }, [paymentState, setPremiumStatus, form]);

  const handlePaymentCancel = useCallback(() => {
    setPaymentState(null);
  }, []);

  const finalAmount = calculateFinalAmount({
    baseAmount: currentAmount,
    discountInfo: paymentState?.discountInfo ?? null,
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal>
      <PopoverTrigger asChild>
        <div className='fixed bottom-4 right-4 z-50'>
          <div className='donate-rainbow relative z-0 overflow-hidden p-0.5 flex items-center justify-center rounded-md hover:scale-102 transition duration-200 active:scale-100'>
            <Button className='shadow-lg rounded-md w-full h-full'>Donate & Unblock</Button>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className='w-96' onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>Support & Unblock</h4>
            <p className='text-muted-foreground text-sm'>Make a donation to support the content and unblock access.</p>
            {Boolean(premiumKey) && (
              <div className='flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'>
                <Star className='w-4 h-4 text-green-500' fill='currentColor' aria-hidden='true' animateOnView loop />
                <span className='text-green-700 dark:text-green-300 font-semibold text-sm'>
                  You are a premium user already. Thank you for your support!
                </span>
              </div>
            )}
          </div>
          {!paymentState ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className='grid gap-3'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='your@email.com'
                          disabled={isPending}
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
                  <Label>Quick amounts</Label>
                  <div className='flex gap-2'>
                    {PRESET_AMOUNTS.map((preset) => (
                      <Button
                        key={preset}
                        type='button'
                        variant={currentAmount === preset ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => handlePresetClick(preset)}
                        disabled={isPending}
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
                      <FormLabel>Donation Amount</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText>{currencySymbol}</InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            type='number'
                            placeholder='Enter amount'
                            step='1'
                            min='1'
                            max='10000'
                            disabled={isPending}
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
                        Base price in {currency}. Final amount will be converted to your local currency at current
                        exchange rates.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Collapsible open={showPromoCode} onOpenChange={setShowPromoCode}>
                  <CollapsibleTrigger className='flex items-center justify-between w-full p-2 text-sm font-medium hover:bg-muted/50 cursor-pointer rounded-md transition-colors'>
                    <span className='text-muted-foreground'>Have a promo code?</span>
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
                    <CollapsibleContent className='pt-2 min-h-[60px]'>
                      <FormField
                        control={form.control}
                        name='promoCode'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='YOU_WISH_IT_WAS_THAT_EASY'
                                disabled={isPending}
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
                <Button type='submit' disabled={isPending} className='w-full bg-green-600 hover:bg-green-700'>
                  {isPending ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </form>
            </Form>
          ) : (
            <PaymentForm
              stripe={stripeClient.getStripePromise()}
              clientSecret={paymentState.clientSecret}
              amount={finalAmount}
              email={paymentState.data.email}
              discountInfo={paymentState.discountInfo}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
