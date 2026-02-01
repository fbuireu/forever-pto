import type { DiscountInfo } from '@domain/payment/models/types';
import type { PromoValidationResult } from '@domain/payment/services/promo-code';

export interface CreatePaymentIntentParams {
  amount: number;
  email: string;
  promoCode?: string;
  discountInfo: DiscountInfo | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface PaymentIntentResult {
  id: string;
  created: number;
  customer: unknown;
  latest_charge: unknown;
  currency: string;
  status: string;
  payment_method_types?: string[];
  description?: string | null;
  client_secret: string | null;
}

export interface PaymentIntentService {
  create(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
}

export interface PromoCodeService {
  validate(code: string, amount: number): Promise<PromoValidationResult>;
}

export interface PaymentHelpers {
  extractCustomerId(customer: unknown): string | null;
  extractChargeId(charge: unknown): string | null;
}
