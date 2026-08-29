"use client";

import { usePremiumStore } from "@application/stores/premium";
import type { DayOutcome } from "@application/stores/types";
import { SupportButton } from "@ui/modules/shared/SupportButton";
import { LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { DAY_REFUSAL_COPY } from "./utils/refusals";

export const usePlannerDayClick = (onDayToggle: (date: Date) => DayOutcome) => {
	const t = useTranslations("toasts");
	const tPremium = useTranslations("premium");
	const premiumKey = usePremiumStore((state) => state.premiumKey);

	return useCallback(
		(date: Date) => {
			if (!premiumKey) {
				toast.info(tPremium("premiumFeature"), {
					description: tPremium("unlockDescription"),
					duration: 7_500,
					classNames: {
						toast: "flex flex-wrap items-center overflow-visible",
						icon: "mt-0.5 shrink-0",
						content: "flex-1",
					},
					icon: <LockIcon size="16" />,
					action: (
						<SupportButton
							label={tPremium("becomePremium")}
							className="w-full py-3 px-2 !bg-[var(--color-brand-ink)] !text-white !border-transparent !shadow-[var(--shadow-brutal-btn-orange)] hover:!shadow-[var(--shadow-brutal-btn-orange-hover)] active:!shadow-[var(--shadow-brutal-btn-orange-active)]"
						/>
					),
				});
				return;
			}

			const outcome = onDayToggle(date);

			if (outcome.applied) return;

			const refusal = DAY_REFUSAL_COPY[outcome.reason];

			if (refusal) toast.warning(t(refusal.title), { description: t(refusal.description) });
		},
		[premiumKey, onDayToggle, t, tPremium],
	);
};
