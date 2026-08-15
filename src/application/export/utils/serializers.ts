export const toIcsDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
};

export const toIcsTimestamp = (date: Date): string => `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
