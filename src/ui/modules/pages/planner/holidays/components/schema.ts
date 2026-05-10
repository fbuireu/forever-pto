import z from 'zod';

export interface HolidaySchemaMessages {
  nameRequired: string;
  nameMax: string;
  invalidDate: string;
}

export const createHolidaySchema = (messages: HolidaySchemaMessages) =>
  z.object({
    name: z.string().min(1, { message: messages.nameRequired }).max(100, { message: messages.nameMax }),
    date: z.date({ message: messages.invalidDate }),
  });

export type HolidayFormData = z.infer<ReturnType<typeof createHolidaySchema>>;
