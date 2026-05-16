import type { DiscountInfo } from '@application/dto/payment/types';

interface CalculateFinalAmount {
  baseAmount: number;
  discountInfo: DiscountInfo | null;
}

export const calculateFinalAmount = ({ baseAmount, discountInfo }: CalculateFinalAmount): number => {
  return discountInfo?.finalAmount ?? baseAmount;
};
