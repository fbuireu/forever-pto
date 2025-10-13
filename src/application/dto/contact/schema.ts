import z from 'zod';

export const contactSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
});

export type ContactFormData = z.infer<typeof contactSchema>;
