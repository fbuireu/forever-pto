"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/modules/core/animate/base/Dialog";
import { Lock } from "@ui/modules/core/animate/icons/Lock";
import { Banner } from "@ui/modules/core/primitives/Banner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@ui/modules/core/primitives/Form";
import { Input } from "@ui/modules/core/primitives/Input";
import { FormButtons } from "@ui/modules/shared/FormButtons";
import { Step, StepOutcome, StepOutcomeTone } from "@ui/modules/shared/StepOutcome";
import { AlertCircle, Crown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface UpgradeModalProps {
	open: boolean;
	onClose: () => void;
	feature: string;
	onVerifyEmail: (email: string) => Promise<boolean>;
	isLoading: boolean;
}

const MS_PER_SECOND = 1000;
const AUTO_CLOSE_MS = 5 * MS_PER_SECOND;

const createEmailSchema = ({ invalid, required }: { invalid: string; required: string }) =>
	z.object({
		email: z.email(invalid).min(1, required),
	});

type EmailFormData = z.infer<ReturnType<typeof createEmailSchema>>;

export const UpgradeModal = ({ open, onClose, feature, onVerifyEmail, isLoading }: UpgradeModalProps) => {
	const t = useTranslations("upgrade");
	const tA11y = useTranslations("a11y");
	const tEmail = useTranslations("validation.email");
	const [step, setStep] = useState<Step>(Step.INPUT);

	const emailSchema = useMemo(
		() => createEmailSchema({ invalid: tEmail("invalid"), required: tEmail("required") }),
		[tEmail],
	);

	const form = useForm<EmailFormData>({
		resolver: zodResolver(emailSchema),
		defaultValues: {
			email: "",
		},
	});

	const handleClose = () => {
		form.reset();
		setStep(Step.INPUT);
		onClose();
	};

	const onSubmit = async (data: EmailFormData) => {
		const success = await onVerifyEmail(data.email);

		if (success) {
			setStep(Step.SUCCESS);
			setTimeout(handleClose, AUTO_CLOSE_MS);
			return;
		}

		setStep(Step.ERROR);
	};

	const handleTryAgain = () => {
		setStep(Step.INPUT);
		form.clearErrors();
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md" closeLabel={tA11y("closeDialog")} initialFocus={false}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Crown className="size-5 text-yellow-500" />
						{t("premiumRequired")}
					</DialogTitle>
					<Banner icon={Lock} title={t("premiumRequired")} colorScheme="indigo">
						<span>
							<strong className="capitalize">{feature}</strong> {t("featureRequiresPremium")}
						</span>
					</Banner>
					<DialogDescription>{t("verifyDescription")}</DialogDescription>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">{t("considerDonating")}</p>

				{step === Step.INPUT && (
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("enterPremiumEmail")}</FormLabel>
										<FormControl>
											<Input
												type="email"
												inputMode="email"
												autoComplete="email"
												placeholder={t("emailPlaceholder")}
												disabled={isLoading}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormButtons
								pending={isLoading}
								submitText={t("verifyAccess")}
								loadingText={t("verifying")}
								cancelText={t("cancel")}
								onCancel={handleClose}
							/>
						</form>
					</Form>
				)}

				{step === Step.SUCCESS && (
					<StepOutcome
						tone={StepOutcomeTone.SUCCESS}
						icon={<Crown className="size-8 text-[var(--color-brand-ink)]" />}
						title={t("accessGranted")}
						description={t("welcomeToPremium", { seconds: AUTO_CLOSE_MS / MS_PER_SECOND })}
						onClose={handleClose}
					/>
				)}

				{step === Step.ERROR && (
					<StepOutcome
						tone={StepOutcomeTone.ERROR}
						icon={<AlertCircle className="size-8 text-white" />}
						title={t("accessDenied")}
						description={t("emailNotFound")}
						onClose={handleClose}
						onTryAgain={handleTryAgain}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
