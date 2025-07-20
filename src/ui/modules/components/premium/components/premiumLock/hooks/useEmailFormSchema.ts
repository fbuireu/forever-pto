import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ZodObject, ZodString } from "zod";
import { z } from "zod";

export const useEmailFormSchema = (): ZodObject<{ email: ZodString }> => {
	const t = useTranslations("modals.premiumLock.errors");

	return useMemo(
		() =>
			z.object({
				email: z.email(t("validation")),
			}),
		[t],
	);
};
