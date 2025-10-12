'use server';

import { paymentDTO } from '@application/dto/payment/dto';
import { createPaymentSchema, type CreatePaymentInput } from '@application/dto/payment/schema';
import type { DiscountInfo, PaymentDTO } from '@application/dto/payment/types';
import { createPaymentError } from '@domain/payment/errors';
import { getTursoClient } from '@infrastructure/clients/db/turso/client';
import { createPaymentIntent } from '@infrastructure/services/payments/provider/payment-intent';
import { validatePromoCode } from '@infrastructure/services/payments/provider/promo-code';
import { savePayment } from '@infrastructure/services/payments/repository';
import { extractChargeId, extractCustomerId } from '@infrastructure/services/payments/utils/helpers';
import Stripe from 'stripe';
import { ZodError } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

const turso = getTursoClient();

export async function createPayment(params: CreatePaymentInput): Promise<PaymentDTO> {
  try {
    const validated = createPaymentSchema.parse(params);

    let finalAmount = validated.amount;
    let discountInfo: DiscountInfo | null = null;

    if (validated.promoCode?.trim()) {
      const validation = await validatePromoCode(stripe, validated.promoCode, validated.amount);

      if (!validation.success) {
        const error = createPaymentError.invalidPromoCode(validation.error);
        return paymentDTO.create({
          raw: { type: 'error', error: new Error(error.message) },
        });
      }

      discountInfo = validation.data;
      finalAmount = discountInfo.finalAmount;
    }

    const paymentIntent = await createPaymentIntent(stripe, {
      amount: finalAmount,
      email: validated.email,
      promoCode: validated.promoCode,
      discountInfo,
    });

    const saveResult = await savePayment(turso, {
      id: paymentIntent.id,
      stripeCreatedAt: new Date(paymentIntent.created * 1000),
      customerId: extractCustomerId(paymentIntent.customer),
      chargeId: extractChargeId(paymentIntent.latest_charge),
      email: validated.email,
      amount: Math.round(finalAmount * 100),
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethodType: paymentIntent.payment_method_types?.[0] || null,
      description: paymentIntent.description || null,
      promoCode: validated.promoCode || null,
    });

    if (!saveResult.success) {
      console.error('Failed to save payment:', saveResult.error);
      console.warn('Payment will be saved via webhook fallback');
    }

    return paymentDTO.create({
      raw: {
        type: 'success',
        data: { paymentIntent, discountInfo },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      const validationError = createPaymentError.validation(firstError?.message || 'Invalid payment data');
      return paymentDTO.create({
        raw: { type: 'error', error: new Error(validationError.message) },
      });
    }

    if (error instanceof Stripe.errors.StripeError) {
      return paymentDTO.create({
        raw: { type: 'error', error },
      });
    }

    console.error('Payment creation error:', error);
    const unknownError = createPaymentError.unknown(error instanceof Error ? error.message : undefined);
    return paymentDTO.create({
      raw: { type: 'error', error: new Error(unknownError.message) },
    });
  }
}
