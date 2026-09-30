import { z } from "zod";

export const premiumSessionSchema = z.object({
	premiumKey: z.string().min(1),
	email: z.string(),
});

export type PremiumSession = z.infer<typeof premiumSessionSchema>;

export const premiumKeySchema = premiumSessionSchema.pick({ premiumKey: true });

export const noPremiumSessionSchema = z.object({
	premiumKey: z.null().optional(),
});

export const activationFailureSchema = z.object({
	error: z.string().optional(),
});
