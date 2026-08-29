"use client";

import type { DiscountInfo } from "@application/dto/payment/types";
import { usePremiumStore } from "@application/stores/premium";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ConfirmPaymentOutcome, confirmPayment } from "@ui/adapters/payments/checkout";
import { ChevronLeft } from "@ui/modules/core/animate/icons/ChevronLeft";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { Button } from "@ui/modules/core/primitives/Button";
import { resolveApiErrorMessage } from "@ui/modules/shared/utils/helpers";
import { useCurrencyFormatter } from "@ui/utils/currencies";
import { Skeleton } from "boneyard-js/react";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ExpressCheckoutFixture } from "./ExpressCheckoutFixture";

const UNKNOWN_PAYMENT_ERROR = "unknown_error";

async function fireConfetti() {
	const confetti = (await import("canvas-confetti")).default;
	const count = 200;
	const defaults = {
		origin: { y: 0.7 },
		colors: ["#10b981", "#059669", "#047857", "#065f46", "#fbbf24", "#f59e0b", "#d97706", "#b45309"],
	};
	interface FireParams {
		particleRatio: number;
		opts: Record<string, unknown>;
	}

	const fire = ({ particleRatio, opts }: FireParams) =>
		confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
	fire({ particleRatio: 0.25, opts: { spread: 26, startVelocity: 55 } });
	fire({ particleRatio: 0.2, opts: { spread: 60 } });
	fire({ particleRatio: 0.35, opts: { spread: 100, decay: 0.91, scalar: 0.8 } });
	fire({ particleRatio: 0.1, opts: { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 } });
	fire({ particleRatio: 0.1, opts: { spread: 120, startVelocity: 45 } });
}

interface CheckoutFormProps {
	amount: number;
	email: string;
	discountInfo: DiscountInfo | null;
	onSuccess: () => void;
	onCancel: () => void;
}

export function CheckoutForm({ amount, email, discountInfo, onSuccess, onCancel }: Readonly<CheckoutFormProps>) {
	const stripe = useStripe();
	const elements = useElements();
	const locale = useLocale();
	const t = useTranslations("checkout");
	const tErrors = useTranslations("errors");
	const formatCurrency = useCurrencyFormatter();
	const [isExpressReady, setIsExpressReady] = useState(false);
	const [hasExpressOptions, setHasExpressOptions] = useState<boolean | null>(null);
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const setPremiumStatus = usePremiumStore((state) => state.setPremiumStatus);

	useEffect(() => {
		void import("canvas-confetti");
	}, []);

	const formattedAmount = useMemo(() => formatCurrency(amount), [amount, formatCurrency]);
	const discountText = useMemo(() => {
		if (!discountInfo) return null;
		return t("promoSaved", { saved: formatCurrency(discountInfo.originalAmount - discountInfo.finalAmount) });
	}, [discountInfo, t, formatCurrency]);

	const processPayment = useCallback(async () => {
		if (!stripe || !elements) return;

		setErrorMessage(null);

		const result = await confirmPayment({
			stripe,
			elements,
			email,
			returnUrl: `${globalThis.location.origin}/api/payment/activate?locale=${locale}`,
		});

		switch (result.outcome) {
			case ConfirmPaymentOutcome.FAILED_AFTER_CHARGE:
				setErrorMessage(t("activationFailed"));
				track({ event: "payment_activation_failed", properties: { error: result.error || UNKNOWN_PAYMENT_ERROR } });
				return;

			case ConfirmPaymentOutcome.REFUSED_BEFORE_CHARGE:
				setErrorMessage(
					resolveApiErrorMessage({ code: result.error, t, shared: tErrors, fallback: t("paymentFailed") }),
				);
				track({ event: "payment_failed", properties: { error: result.error || UNKNOWN_PAYMENT_ERROR } });
				return;

			case ConfirmPaymentOutcome.HANDED_OFF_TO_ISSUER:
				return;

			case ConfirmPaymentOutcome.SUCCEEDED:
				setPremiumStatus({ email: result.sessionData.email, premiumKey: result.sessionData.premiumKey });
				track({ event: "payment_completed", properties: { amount } });
				void fireConfetti();
				setTimeout(() => {
					onSuccess();
				}, 1000);
				return;
		}
	}, [stripe, elements, email, onSuccess, setPremiumStatus, t, tErrors, locale, amount]);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			startTransition(async () => {
				await processPayment();
			});
		},
		[processPayment],
	);

	const handleExpressCheckout = useCallback(async () => {
		startTransition(async () => {
			await processPayment();
		});
	}, [processPayment]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<AnimateIcon animateOnHover>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onCancel}
						disabled={isPending}
						className="gap-2"
						aria-label={t("goBackToDonation")}
					>
						<ChevronLeft className="size-4" aria-hidden="true" />
						{t("back")}
					</Button>
				</AnimateIcon>
				<div className="text-right">
					<p className="text-sm text-muted-foreground">{t("totalAmount")}</p>
					<p className="text-2xl font-bold" aria-live="polite">
						{formattedAmount}
					</p>
					{discountText && (
						<p className="text-xs text-green-600 dark:text-green-400" aria-live="polite">
							{discountText}
						</p>
					)}
				</div>
			</div>
			<form onSubmit={handleSubmit} className="space-y-4">
				{hasExpressOptions !== false && (
					<div className="space-y-3">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-card px-2 text-muted-foreground">{t("expressCheckout")}</span>
							</div>
						</div>
						<div className="relative min-h-12">
							<Skeleton
								name="express-checkout"
								loading={!isExpressReady}
								fixture={<ExpressCheckoutFixture />}
								fallback={<ExpressCheckoutFixture />}
							>
								<div />
							</Skeleton>
							<div className={!isExpressReady ? "invisible absolute inset-0" : "visible"}>
								<ExpressCheckoutElement
									onConfirm={handleExpressCheckout}
									onReady={(event) => {
										setIsExpressReady(true);
										setHasExpressOptions(!!event.availablePaymentMethods);
									}}
								/>
							</div>
						</div>
					</div>
				)}
				<div className="space-y-3">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">{t("orPayWithCard")}</span>
						</div>
					</div>
					<PaymentElement />
				</div>
				{errorMessage && (
					<div className="relative overflow-hidden rounded-lg border border-destructive/20 bg-destructive/5 p-4 backdrop-blur-sm">
						<div className="absolute inset-0" />
						<div className="relative flex items-start gap-3">
							<div className="shrink-0 size-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
								<AlertCircle className="size-3 text-destructive" />
							</div>
							<div className="flex-1">
								<h4 className="text-sm font-medium text-destructive mb-1">{t("paymentError")}</h4>
								<p className="text-sm text-destructive/80">{errorMessage}</p>
							</div>
						</div>
					</div>
				)}
				<Button
					type="submit"
					disabled={!stripe || isPending || !elements}
					className="w-full bg-green-600 hover:bg-green-700"
					aria-busy={isPending}
				>
					{isPending ? t("processing") : `${t("pay")} ${formattedAmount}`}
				</Button>
			</form>
		</div>
	);
}
