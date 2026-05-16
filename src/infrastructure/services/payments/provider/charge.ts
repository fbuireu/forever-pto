import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import type { PaymentError } from '@infrastructure/errors';
import { Effect } from 'effect';

interface ChargeData {
  id: string;
  receiptUrl: string | null;
  paymentMethodType: string | null;
  country: string | null;
  customerName: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  paymentBrand: string | null;
  paymentLast4: string | null;
  feeAmount: number | null;
  netAmount: number | null;
}

export const retrieveCharge = (chargeId: string): Effect.Effect<ChargeData, PaymentError, StripeServerService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeServerService;
    const charge = yield* stripe.charges.retrieve(chargeId);
    const billingDetails = charge.billing_details;
    const paymentMethodDetails = charge.payment_method_details;

    return {
      id: charge.id,
      receiptUrl: charge.receipt_url,
      paymentMethodType: paymentMethodDetails?.type ?? null,
      country: billingDetails?.address?.country ?? null,
      customerName: billingDetails?.name ?? null,
      postalCode: billingDetails?.address?.postal_code ?? null,
      city: billingDetails?.address?.city ?? null,
      state: billingDetails?.address?.state ?? null,
      paymentBrand: paymentMethodDetails?.card?.brand ?? null,
      paymentLast4: paymentMethodDetails?.card?.last4 ?? null,
      feeAmount: charge.application_fee_amount ?? null,
      netAmount: charge.amount - (charge.application_fee_amount ?? 0),
    };
  });
