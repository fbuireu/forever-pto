import type { DiscountInfo } from '@domain/payment/models/types';

export const formatDiscountMessage = (discountInfo: DiscountInfo) => {
  const saved = discountInfo.originalAmount - discountInfo.finalAmount;

  return {
    title: 'Promo code applied!',
    description: `You saved €${saved.toFixed(2)} (Original: €${discountInfo.originalAmount.toFixed(2)}, Final: €${discountInfo.finalAmount.toFixed(2)})`,
  };
};

export const formatDiscountText = (discountInfo: DiscountInfo | null): string | null => {
  if (!discountInfo) return null;

  const saved = discountInfo.originalAmount - discountInfo.finalAmount;
  return `You saved €${saved.toFixed(2)}!`;
};

export const formatAmount = (amount: number, locale: string, currency: string): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};
