"use client";

import { useCurrentYear } from "@ui/hooks/useCurrentYear";
import { useTranslations } from "next-intl";

interface CopyrightProps {
	serverYear: number;
}

export const Copyright = ({ serverYear }: CopyrightProps) => {
	const t = useTranslations("footer");
	const year = useCurrentYear(serverYear);

	return t("copyright", { year });
};
