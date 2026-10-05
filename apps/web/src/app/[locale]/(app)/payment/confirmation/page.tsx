import { hasSucceeded, wasCharged } from "@application/dto/payment/dto";
import { paymentConfirmationQuerySchema } from "@application/dto/payment/schema";
import { ACTIVATION_FAILED } from "@application/dto/payment/types";
import { Link } from "@application/i18n/navigation";
import { localePath } from "@infrastructure/i18n/utils/url";
import { ApplicationLayer } from "@infrastructure/layers";
import { routeMetadata } from "@infrastructure/seo/routeMetadata";
import { confirmation } from "@infrastructure/services/payments/confirmation";
import { traced } from "@infrastructure/span";
import { Button } from "@ui/modules/core/primitives/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/modules/core/primitives/Card";
import { MAIN_CONTENT_ID } from "@ui/modules/layout/SkipToContent";
import { PremiumSessionSync } from "@ui/modules/premium/PremiumSessionSync";
import { Effect } from "effect";
import { CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import type { Locale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";

export const generateMetadata = routeMetadata("/payment/confirmation");

interface PaymentConfirmationPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
	params: Promise<{ locale: Locale }>;
}

interface PaymentErrorProps {
	charged: boolean;
	locale: Locale;
}

async function PaymentError({ charged, locale }: PaymentErrorProps) {
	const t = await getTranslations({ locale, namespace: "paymentConfirmation.failed" });

	if (charged) {
		return (
			<main id={MAIN_CONTENT_ID} className="min-h-screen flex items-center justify-center p-4 bg-background">
				<Card className="w-full max-w-md border-caution-base/50">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-caution-base/10">
							<XCircle className="size-6 text-caution-base" />
						</div>
						<CardTitle className="text-caution">{t("unconfirmedTitle")}</CardTitle>
						<CardDescription>{t("unconfirmedDescription")}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full">
							<Link href="/">{t("returnHome")}</Link>
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<main id={MAIN_CONTENT_ID} className="min-h-screen flex items-center justify-center p-4 bg-background">
			<Card className="w-full max-w-md border-destructive/50">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
						<XCircle className="size-6 text-destructive" />
					</div>
					<CardTitle className="text-destructive">{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
						<p className="mb-2 font-medium text-foreground">{t("whatHappened")}</p>
						<ul className="space-y-1 list-disc list-inside">
							<li>{t("declined")}</li>
							<li>{t("authFailed")}</li>
							<li>{t("sessionExpired")}</li>
						</ul>
					</div>
					<div className="flex flex-col gap-2">
						<Button asChild className="w-full">
							<Link href="/">{t("returnHome")}</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}

export default async function PaymentConfirmationPage({
	searchParams,
	params,
}: Readonly<PaymentConfirmationPageProps>) {
	const [query, { locale }] = await Promise.all([searchParams, params]);
	const { payment_intent: paymentIntentId, activation } = paymentConfirmationQuerySchema.validate(query) ? query : {};
	const hasActivated = activation !== ACTIVATION_FAILED;

	if (!paymentIntentId) {
		redirect(localePath({ locale }));
	}

	const data = await traced({
		name: "paymentConfirmation",
		run: () => Effect.runPromise(confirmation(paymentIntentId).pipe(Effect.provide(ApplicationLayer))),
	});

	if (!data || !hasSucceeded(data)) {
		return <PaymentError charged={wasCharged(data)} locale={locale} />;
	}

	const [t, format] = await Promise.all([
		getTranslations({ locale, namespace: "paymentConfirmation.success" }),
		getFormatter({ locale }),
	]);
	const formattedAmount = format.number(data.amount, {
		style: "currency",
		currency: data.currency,
		minimumFractionDigits: 2,
	});

	return (
		<main id={MAIN_CONTENT_ID} className="min-h-screen flex items-center justify-center p-4 bg-background m-auto">
			<Card className="w-full max-w-md border-positive-base/50">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-positive-base/10">
						<CheckCircle2 className="size-6 text-positive-base" />
					</div>
					<CardTitle className="text-positive">{t("title")}</CardTitle>
					<CardDescription>{t("thankYou")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg bg-muted p-4 space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">{t("amountPaid")}</span>
							<span className="font-medium">{formattedAmount}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">{t("status")}</span>
							<span className="font-medium text-positive">{t("confirmed")}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">{t("paymentId")}</span>
							<span className="font-mono text-xs text-muted-foreground">{data.id.slice(0, 20)}...</span>
						</div>
					</div>

					{hasActivated && <PremiumSessionSync />}
					{hasActivated ? (
						<div className="rounded-lg bg-positive-base/10 border border-positive-base/20 p-4 text-sm">
							<p className="text-positive-strong">{t("premiumActivated")}</p>
						</div>
					) : (
						<div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm">
							<p className="text-destructive">{t("premiumActivationFailed")}</p>
						</div>
					)}

					<Button asChild className="w-full bg-positive-action hover:bg-success">
						<Link href="/">{t("continueHome")}</Link>
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
