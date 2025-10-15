import z from 'zod';

export const holidaySchema = z.object({
  name: z.string().min(1, { message: 'Holiday name is required' }).max(100, { message: 'Holiday name is too long' }),
  date: z.date({ message: 'Please select a valid date' }),
});

export type HolidayFormData = z.infer<typeof holidaySchema>;
