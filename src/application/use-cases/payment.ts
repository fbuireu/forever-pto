import type { PaymentHelpers, PaymentIntentService, PromoCodeService } from '@application/interfaces/payment-services';
import { paymentDTO } from '@application/dto/payment/dto';
import { createPaymentSchema, type CreatePaymentInput } from '@application/dto/payment/schema';
import type { PaymentDTO } from '@application/dto/payment/types';
import type { DiscountInfo } from '@domain/payment/models/types';
import { createPaymentError } from '@domain/payment/events/factory/errors';
import type { PaymentRepository } from '@domain/payment/repository/types';
import type { Logger } from '@domain/shared/types';
import Stripe from 'stripe';
import { ZodError } from 'zod';

interface PaymentContext {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface CreatePaymentDependencies {
  logger: Logger;
  paymentRepository: PaymentRepository;
  paymentIntentService: PaymentIntentService;
  promoCodeService: PromoCodeService;
  paymentHelpers: PaymentHelpers;
}

export async function createPayment(
  params: CreatePaymentInput,
  context: PaymentContext,
  deps: CreatePaymentDependencies
): Promise<PaymentDTO> {
  const { userAgent, ipAddress } = context;
  const { logger, paymentRepository, paymentIntentService, promoCodeService, paymentHelpers } = deps;

  try {
    const validated = createPaymentSchema.parse(params);

    let finalAmount = validated.amount;
    let discountInfo: DiscountInfo | null = null;

    if (validated.promoCode?.trim()) {
      const validation = await promoCodeService.validate(validated.promoCode, validated.amount);

      if (!validation.success) {
        const error = createPaymentError.invalidPromoCode(validation.error);
        return paymentDTO.create({
          raw: { type: 'error', error: new Error(error.message) },
        });
      }

      discountInfo = validation.data;
      finalAmount = discountInfo.finalAmount;
    }

    const paymentIntent = await paymentIntentService.create({
      amount: finalAmount,
      email: validated.email,
      promoCode: validated.promoCode,
      discountInfo,
      userAgent,
      ipAddress,
    });

    const saveResult = await paymentRepository.save({
      id: paymentIntent.id,
      stripeCreatedAt: new Date(paymentIntent.created * 1000),
      customerId: paymentHelpers.extractCustomerId(paymentIntent.customer),
      chargeId: paymentHelpers.extractChargeId(paymentIntent.latest_charge),
      email: validated.email,
      amount: Math.round(finalAmount * 100),
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethodType: paymentIntent.payment_method_types?.[0] ?? null,
      description: paymentIntent.description ?? null,
      promoCode: validated.promoCode ?? null,
      userAgent,
      ipAddress,
      country: null,
      customerName: null,
      postalCode: null,
      city: null,
      state: null,
      paymentBrand: null,
      paymentLast4: null,
      feeAmount: null,
      netAmount: null,
      refundedAt: null,
      refundReason: null,
      disputedAt: null,
      disputeReason: null,
      parentPaymentId: null,
    });

    if (!saveResult.success) {
      logger.warn('Failed to save payment to database, will use webhook fallback', {
        reason: saveResult.error,
        paymentIntentId: paymentIntent.id,
        emailDomain: validated.email?.split('@')[1],
      });
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
      logger.warn('Payment validation error', {
        field: firstError?.path.join('.'),
        message: firstError?.message,
        code: firstError?.code,
      });
      const validationError = createPaymentError.validation(firstError?.message ?? 'Invalid payment data');
      return paymentDTO.create({
        raw: { type: 'error', error: new Error(validationError.message) },
      });
    }

    if (error instanceof Stripe.errors.StripeError) {
      logger.logError('Stripe payment creation error', error, {
        stripeErrorType: error.type,
        stripeErrorCode: error.code,
        amount: params.amount,
        hasPromoCode: !!params.promoCode,
        userAgent,
        ipAddress,
      });
      return paymentDTO.create({
        raw: { type: 'error', error },
      });
    }

    logger.logError('Unknown payment creation error', error, {
      amount: params.amount,
      hasPromoCode: !!params.promoCode,
      userAgent,
      ipAddress,
    });
    const unknownError = createPaymentError.unknown(error instanceof Error ? error.message : undefined);
    return paymentDTO.create({
      raw: { type: 'error', error: new Error(unknownError.message) },
    });
  }
}
