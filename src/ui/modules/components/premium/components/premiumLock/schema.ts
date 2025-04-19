import { z } from "zod";

export const emailFormSchema = z.object({
	email: z.string().email("Por favor, introduce un email válido"),
});
