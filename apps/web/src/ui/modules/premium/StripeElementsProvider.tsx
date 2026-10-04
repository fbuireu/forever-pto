"use client";

import { getStripeClientInstance } from "@infrastructure/clients/payments/stripe/client";
import { Elements } from "@stripe/react-stripe-js";
import type { Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import { ChevronLeft } from "@ui/modules/core/animate/icons/ChevronLeft";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { Button } from "@ui/modules/core/primitives/Button";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { StripeLoadingFixture } from "./StripeLoadingFixture";

type StripeLoad = { status: "loading" } | { status: "ready"; stripe: Stripe } | { status: "failed" };

interface StripeUnavailableProps {
	isRetrying: boolean;
	onRetry: () => void;
	onCancel: () => void;
}

function StripeUnavailable({ isRetrying, onRetry, onCancel }: Readonly<StripeUnavailableProps>) {
	const t = useTranslations("checkout");

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<AnimateIcon animateOnHover>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onCancel}
						className="gap-2"
						aria-label={t("goBackToDonation")}
					>
						<ChevronLeft className="size-4" aria-hidden="true" />
						{t("back")}
					</Button>
				</AnimateIcon>
			</div>
			<div
				role="alert"
				className="flex items-start gap-3 rounded-[10px] border-[3px] border-(--frame) bg-[color-mix(in_srgb,var(--destructive)_12%,var(--card)_88%)] p-4 shadow-(--shadow-brutal-sm)"
			>
				<AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
				<div className="flex-1">
					<h4 className="mb-1 text-sm font-black text-destructive">{t("formUnavailable")}</h4>
					<p className="text-sm">{t("formUnavailableDescription")}</p>
				</div>
			</div>
			<Button
				type="button"
				variant="outline"
				className="w-full"
				onClick={onRetry}
				disabled={isRetrying}
				aria-busy={isRetrying}
			>
				{t("tryAgain")}
			</Button>
		</div>
	);
}

interface StripeElementsProviderProps {
	options: StripeElementsOptions;
	onCancel: () => void;
	children: ReactNode;
}

export function StripeElementsProvider({ options, onCancel, children }: Readonly<StripeElementsProviderProps>) {
	const [load, setLoad] = useState<StripeLoad>({ status: "loading" });
	const [isRetrying, setIsRetrying] = useState(false);

	const ask = useCallback(() => {
		getStripeClientInstance()
			.getStripePromise()
			.then(
				(stripe) => {
					setLoad(stripe ? { status: "ready", stripe } : { status: "failed" });
					setIsRetrying(false);
				},
				() => {
					setLoad({ status: "failed" });
					setIsRetrying(false);
				},
			);
	}, []);

	useEffect(() => {
		ask();
	}, [ask]);

	if (load.status === "failed") {
		return (
			<StripeUnavailable
				isRetrying={isRetrying}
				onRetry={() => {
					setIsRetrying(true);
					ask();
				}}
				onCancel={onCancel}
			/>
		);
	}

	if (load.status === "loading") return <StripeLoadingFixture />;

	return (
		<Elements stripe={load.stripe} options={options}>
			{children}
		</Elements>
	);
}
