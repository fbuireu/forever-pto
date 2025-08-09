export const ensureDate = (date: Date | string): Date => {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date instanceof Date ? date : new Date(date);
};
