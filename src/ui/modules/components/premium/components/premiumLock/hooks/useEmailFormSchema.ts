import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ZodEmail, ZodObject } from "zod";
import { z } from "zod";

export const useEmailFormSchema = (): ZodObject<{
	email: ZodEmail;
}> => {
	const t = useTranslations("modals.premiumLock.errors");

	return useMemo(
		() =>
			z.object({
				email: z.email(t("validation")),
			}),
		[t],
	);
};
