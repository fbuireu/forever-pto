import { DiscountInfo } from '@application/dto/payment/types';

interface CalculateFinalAmount {
  baseAmount: number;
  discountInfo: DiscountInfo | null;
}

export const calculateFinalAmount = ({ baseAmount, discountInfo }: CalculateFinalAmount): number => {
  return discountInfo?.finalAmount ?? baseAmount;
};


const formatDiscountValue = (discountInfo: DiscountInfo): string => {
  return discountInfo.type === 'percent' 
    ? `${discountInfo.value}%` 
    : `€${discountInfo.value.toFixed(2)}`;
};

export const formatDiscountMessage = (discountInfo: DiscountInfo): {
  title: string;
  description: string;
} => {
  const discountValue = formatDiscountValue(discountInfo);

  return {
    title: 'Promo code applied!',
    description: `${discountValue} discount - New amount: €${discountInfo.finalAmount.toFixed(2)}`,
  };
};

export const formatDiscountText = (discountInfo: DiscountInfo | null): string | null => {
  if (!discountInfo) return null;
  
  const discountValue = formatDiscountValue(discountInfo);
  return `${discountValue} discount applied`;
};