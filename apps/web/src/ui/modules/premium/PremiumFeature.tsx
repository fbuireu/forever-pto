"use client";

import type { PremiumFeatureId, PremiumOrigin } from "@application/stores/premium";
import { usePremiumGate } from "@ui/hooks/usePremiumGate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui/modules/core/animate/base/Tooltip";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { Lock } from "@ui/modules/core/animate/icons/Lock";
import { cn } from "@ui/utils/cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { usePremiumFeatureLabel } from "./featureLabels";
import { PremiumLock } from "./PremiumLock";

export const PremiumFeatureVariant = {
	DEFAULT: "default",
	STACK: "stack",
} as const;

export type PremiumFeatureVariant = (typeof PremiumFeatureVariant)[keyof typeof PremiumFeatureVariant];

interface PremiumFeatureProps {
	feature: PremiumFeatureId;
	origin: PremiumOrigin;
	children: ReactNode;
	className?: string;
	description?: string;
	variant?: PremiumFeatureVariant;
	iconSize?: string;
	inlineDescription?: boolean;
}

export const PremiumFeature = ({
	feature,
	origin,
	children,
	className,
	description,
	variant = PremiumFeatureVariant.DEFAULT,
	iconSize = "size-6",
	inlineDescription = false,
}: PremiumFeatureProps) => {
	const t = useTranslations("premium");
	const featureLabel = usePremiumFeatureLabel();
	const { isLocked, unlock } = usePremiumGate({ feature, origin });

	if (!isLocked) {
		return <>{children}</>;
	}

	const lockPadding = variant === PremiumFeatureVariant.STACK ? "p-1 lg:p-2" : "p-2";

	return (
		<AnimateIcon animateOnHover asChild>
			{/* biome-ignore lint/a11y/useSemanticElements: children may render as <button>, avoiding invalid nested button HTML */}
			<div
				role="button"
				tabIndex={0}
				className={cn(
					"relative m-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-2 rounded-full cursor-pointer",
					variant === PremiumFeatureVariant.STACK ? "w-fit" : "w-full backdrop-blur-sm",
					className,
				)}
				aria-label={description ?? t("unlockFeature", { feature: featureLabel(feature) })}
				onClick={unlock}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						unlock();
					}
				}}
			>
				<div className="blur-[4px]" aria-hidden="true" inert>
					{children}
				</div>
				<div
					className={cn(
						"absolute inset-0 flex items-center justify-center",
						variant === PremiumFeatureVariant.STACK && "lg:justify-start lg:-translate-x-1",
					)}
				>
					{description && !inlineDescription ? (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild onClick={(event) => event.preventBaseUIHandler()}>
									<button
										type="button"
										tabIndex={-1}
										aria-hidden="true"
										className={cn(
											"relative inline-flex cursor-pointer items-center justify-center rounded-[8px] border-[3px] border-[var(--frame)] bg-background rotate-[-4deg] shadow-[var(--shadow-brutal-3)]",
											lockPadding,
										)}
									>
										<Lock className={cn(iconSize, "text-foreground")} />
										<span className="absolute -top-2.5 -right-2.5 size-4 inline-flex items-center justify-center rounded-[4px] border-[2px] border-[var(--frame)] bg-[var(--accent)] text-[var(--color-brand-ink)] font-mono font-black text-[10px] leading-none">
											i
										</span>
									</button>
								</TooltipTrigger>
								<TooltipContent className="w-50 text-pretty">{description}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					) : (
						<div className="flex flex-col items-center gap-2 text-center px-4">
							<PremiumLock className={lockPadding} iconSize={iconSize} />
							{inlineDescription && (
								<div className="text-sm text-foreground dark:[text-shadow:0_2px_4px_var(--shade)]">{description}</div>
							)}
						</div>
					)}
				</div>
			</div>
		</AnimateIcon>
	);
};
