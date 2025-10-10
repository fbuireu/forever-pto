const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_AMOUNT = 1;

export const validateEmail = (value: string): boolean => {
  return typeof value === 'string' && EMAIL_REGEX.test(value);
};

export const validateAmount = (value: number, minAmount: number = MIN_AMOUNT): boolean => {
  return typeof value === 'number' && value >= minAmount;
};

export const isValidPromoCode = (value: string): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};
