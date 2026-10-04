"use client";

import {
	AMOUNT_MAX,
	AMOUNT_MIN,
	amountFromField,
	type CreatePaymentInput,
	createDonationFormSchemaWithMessages,
} from "@application/dto/payment/schema";
import { type DiscountInfo, type PromoCodeErrorCode, PromoCodeErrors } from "@application/dto/payment/types";
import { usePremiumStore } from "@application/stores/premium";
import { DonateSource, useUIStore } from "@application/stores/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { PromoCodeError } from "@infrastructure/errors";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { initializePayment } from "@ui/adapters/payments/checkout";
import { useIsMobile } from "@ui/hooks/useMobile";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/modules/core/animate/base/Popover";
import { Star } from "@ui/modules/core/animate/icons/Star";
import { Button } from "@ui/modules/core/primitives/Button";
import { cn } from "@ui/utils/cn";
import { DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL, useCurrencyFormatter } from "@ui/utils/currencies";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { DonationForm } from "./DonationForm";
import { stripeAppearance, stripeFonts } from "./stripeAppearance";
import "./donate.css";
import { logClientError } from "@application/shared/utils/clientLog";
import { recoverFromStaleDeployment } from "@ui/adapters/navigation/staleDeployment";
import { CheckoutForm } from "@ui/modules/premium/CheckoutForm";
import { StripeElementsProvider } from "@ui/modules/premium/StripeElementsProvider";

interface PaymentState {
	clientSecret: string;
	data: CreatePaymentInput;
	discountInfo: DiscountInfo | null;
}

export interface DonateProps {
	bottomClassName: string;
}

export const Donate = ({ bottomClassName }: DonateProps) => {
	const locale = useLocale();
	const t = useTranslations("toasts");
	const tDonate = useTranslations("donate");
	const tValidation = useTranslations("validation.payment");
	const tEmail = useTranslations("validation.email");
	const { resolvedTheme } = useTheme();
	const isMobile = useIsMobile();
	const formatCurrency = useCurrencyFormatter();
	const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
	const [isPending, startTransition] = useTransition();

	const { premiumKey, userEmail, setEmail } = usePremiumStore(
		useShallow((state) => ({
			premiumKey: state.premiumKey,
			userEmail: state.userEmail,
			setEmail: state.setEmail,
		})),
	);

	const { isOpen, isOpening, setDonatePopoverOpen, clearDonatePopoverOpening } = useUIStore(
		useShallow((state) => ({
			isOpen: state.donatePopoverOpen,
			isOpening: state.donatePopoverIsOpening,
			setDonatePopoverOpen: state.setDonatePopoverOpen,
			clearDonatePopoverOpening: state.clearDonatePopoverOpening,
		})),
	);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open) track({ event: "donate_opened", properties: { source: DonateSource.FLOATING } });
			setDonatePopoverOpen(open);
		},
		[setDonatePopoverOpen],
	);

	const donationFormSchema = createDonationFormSchemaWithMessages({
		amountMin: tValidation("amountMin", { min: AMOUNT_MIN }),
		amountMax: tValidation("amountMax", { max: AMOUNT_MAX }),
		invalidEmail: tEmail("invalid"),
		emailRequired: tEmail("required"),
		promoCodeTooLong: tValidation("promoCodeTooLong"),
	});

	const form = useForm({
		resolver: zodResolver(donationFormSchema),
		resetOptions: { keepDirtyValues: true },
		values: {
			amount: 5,
			promoCode: "",
			email: userEmail ?? "",
		},
	});

	const currentAmount = amountFromField(form.watch("amount"));

	const onSubmit = useCallback(
		(data: CreatePaymentInput) => {
			startTransition(async () => {
				try {
					setEmail(data.email);
					const result = await initializePayment({
						amount: data.amount,
						email: data.email,
						promoCode: data.promoCode,
					});

					if (result.discountInfo) {
						toast.success(t("promoApplied"), {
							description: t("promoSavedDescription", {
								saved: formatCurrency(result.discountInfo.originalAmount - result.discountInfo.finalAmount),
								original: formatCurrency(result.discountInfo.originalAmount),
								final: formatCurrency(result.discountInfo.finalAmount),
							}),
						});
						track({
							event: "promo_code_applied",
							properties: {
								discountType: result.discountInfo.type,
								discountValue: result.discountInfo.value,
								originalAmount: result.discountInfo.originalAmount,
								finalAmount: result.discountInfo.finalAmount,
							},
						});
					}

					track({
						event: "payment_started",
						properties: { amount: data.amount, currency: DEFAULT_CURRENCY, hasPromoCode: !!data.promoCode },
					});

					setPaymentState({
						clientSecret: result.clientSecret,
						data,
						discountInfo: result.discountInfo ?? null,
					});
				} catch (error) {
					if (recoverFromStaleDeployment(error)) return;
					logClientError({
						message: "Payment initialization failed in Donate component",
						error,
						context: {
							amount: data.amount,
							hasPromoCode: !!data.promoCode,
							promoCodeLength: data.promoCode?.length,
							currency: DEFAULT_CURRENCY,
							locale,
						},
					});
					if (error instanceof PromoCodeError) {
						const descriptions = {
							[PromoCodeErrors.INVALID_OR_EXPIRED]: t("promoCodeErrors.invalid_or_expired"),
							[PromoCodeErrors.USAGE_LIMIT_REACHED]: t("promoCodeErrors.usage_limit_reached"),
							[PromoCodeErrors.COUPON_EXPIRED]: t("promoCodeErrors.coupon_expired"),
							[PromoCodeErrors.COUPON_INVALID]: t("promoCodeErrors.coupon_invalid"),
							[PromoCodeErrors.FAILED_TO_LOAD]: t("promoCodeErrors.failed_to_load"),
							[PromoCodeErrors.MIN_AMOUNT_EXCEEDED]: t("promoCodeErrors.min_amount_exceeded"),
						} satisfies Record<PromoCodeErrorCode, string>;
						toast.error(t("promoCodeError"), {
							description: descriptions[error.code],
						});
					} else {
						toast.error(t("paymentFailed"), {
							description: t("paymentFailedDescription"),
						});
					}
				}
			});
		},
		[setEmail, locale, t, formatCurrency],
	);

	const handlePaymentSuccess = useCallback(() => {
		toast.success(t("paymentSuccess"), {
			description: t("paymentSuccessDescription"),
			duration: 8000,
		});

		form.reset();
		setPaymentState(null);
		setDonatePopoverOpen(false);
	}, [form, setDonatePopoverOpen, t]);

	useEffect(() => {
		if (isOpen && isOpening) clearDonatePopoverOpening();
	}, [isOpen, isOpening, clearDonatePopoverOpening]);

	const handlePaymentCancel = useCallback(() => {
		track({ event: "payment_cancelled" });
		setPaymentState(null);
	}, []);

	const finalAmount = paymentState?.discountInfo?.finalAmount ?? currentAmount;

	const elementsOptions = useMemo<StripeElementsOptions | undefined>(() => {
		if (!paymentState?.clientSecret) return undefined;

		return {
			clientSecret: paymentState.clientSecret,
			loader: "always",
			appearance: stripeAppearance({ isDark: resolvedTheme === "dark", isMobile }),
			fonts: stripeFonts(globalThis.location.origin),
		};
	}, [paymentState?.clientSecret, resolvedTheme, isMobile]);

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<div
				className={cn(
					"donate-trigger pointer-events-none fixed w-full right-0 md:w-auto md:right-4 z-50",
					bottomClassName,
				)}
			>
				<div
					className="donate-brutal pointer-events-auto"
					style={{ animationPlayState: isOpen ? "paused" : "running" }}
				>
					<PopoverTrigger asChild>
						<Button className="donate-brutal-btn w-full py-3">{tDonate("donateAndUnblock")}</Button>
					</PopoverTrigger>
				</div>
			</div>
			<PopoverContent className="w-96 max-w-[calc(100vw-2rem)] max-h-(--available-height) overflow-y-auto overscroll-contain bg-card text-card-foreground">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h2 className="text-lg leading-none font-black tracking-[-0.03em]">{tDonate("supportAndUnblock")}</h2>
						<p className="text-muted-foreground text-sm">{tDonate("makeDonation")}</p>
						{premiumKey && (
							<div className="flex items-center gap-2 rounded-[10px] border-[3px] border-(--frame) bg-[color-mix(in_srgb,var(--color-brand-green)_18%,white_82%)] p-2 shadow-(--shadow-brutal-xs) dark:bg-[color-mix(in_srgb,var(--color-brand-green)_16%,black_84%)]">
								<Star
									className="size-4 text-[#3f6212] dark:text-(--color-brand-green)"
									fill="currentColor"
									aria-hidden="true"
									animateOnView
									loop
								/>
								<span className="text-sm font-black text-[#3f6212] dark:text-(--color-brand-green)">
									{tDonate("alreadyPremium")}
								</span>
							</div>
						)}
					</div>

					{!paymentState ? (
						<DonationForm
							form={form}
							onSubmit={onSubmit}
							currentAmount={currentAmount}
							locale={locale}
							currency={DEFAULT_CURRENCY}
							currencySymbol={DEFAULT_CURRENCY_SYMBOL}
							isPending={isPending}
						/>
					) : (
						elementsOptions && (
							<StripeElementsProvider options={elementsOptions} onCancel={handlePaymentCancel}>
								<CheckoutForm
									amount={finalAmount}
									email={paymentState.data.email}
									discountInfo={paymentState.discountInfo}
									onSuccess={handlePaymentSuccess}
									onCancel={handlePaymentCancel}
								/>
							</StripeElementsProvider>
						)
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};
