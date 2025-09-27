interface GetMonthsParamsNames{
    locale: string;
    monthCount: number;
    startYear: number;
    monthOutputFormat?: 'short' | 'long';
}

export const getMonthNames = ({ locale, monthCount, startYear, monthOutputFormat = 'short' }: GetMonthsParamsNames): string[] => {
  const monthNames: string[] = [];
  for (let i = 0; i < monthCount; i++) {
    const year = startYear + Math.floor(i / 12);
    const month = i % 12;
    const date = new Date(year, month, 1);

    const monthName = date.toLocaleDateString(locale, { month: monthOutputFormat });
    const yearSuffix = i >= 12 ? ` '${year.toString().slice(-2)}` : '';

    monthNames.push(`${monthName}${yearSuffix}`);
  }

  return monthNames;
};