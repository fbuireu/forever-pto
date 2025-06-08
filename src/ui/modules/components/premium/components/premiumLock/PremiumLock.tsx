"use client";

import { checkPremiumByEmail } from "@application/actions/premium";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogClose } from "@modules/components/core/dialog/atoms/dialogClose/DialogClose";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogDescription } from "@modules/components/core/dialog/atoms/dialogDescription/DialogDescription";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { FormMessage } from "@modules/components/core/form/atoms/FormMessage";
import { FormFieldProvider as FormField } from "@modules/components/core/form/providers/FormFieldProvider/FormFieldProvider";
import { FormItemProvider as FormItem } from "@modules/components/core/form/providers/FormItemProvider/FormItemProvider";
import { useEmailFormSchema } from "@modules/components/premium/components/premiumLock/hooks/useEmailFormSchema";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "@ui/modules/components/core/button/Button";
import { Dialog } from "@ui/modules/components/core/dialog/Dialog";
import { Form } from "@ui/modules/components/core/form/Form";
import { FormLabel } from "@ui/modules/components/core/form/atoms/FormLabel";
import { Input } from "@ui/modules/components/core/input/Input";
import { Tooltip } from "@ui/modules/components/core/tooltip/Tooltip";
import { TooltipContent } from "@ui/modules/components/core/tooltip/atoms/tooltipContent/TooltipContent";
import { TooltipTrigger } from "@ui/modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger";
import { TooltipProvider } from "@ui/modules/components/core/tooltip/provider/TooltipProvider";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { LockIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type MouseEvent, type ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

interface PremiumLockProps {
	children: ReactNode;
	isActive?: boolean;
	featureName?: string;
	featureDescription?: string;
	renderUnlocked?: (isPremium: boolean) => ReactNode;
	variant?: "small" | "default" | "stacked";
}

export const PremiumLock = ({
	children,
	isActive = true,
	featureName,
	featureDescription,
	renderUnlocked,
	variant = "default",
}: PremiumLockProps) => {
	const { isPremiumUser, isPremiumUserLoading, activatePremium } = usePremiumStore();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [isPending, startTransition] = useTransition();
	const t = useTranslations("premiumLock");
	const emailFormSchema = useEmailFormSchema();

	const form = useForm<z.infer<typeof emailFormSchema>>({
		resolver: zodResolver(emailFormSchema),
		defaultValues: {
			email: "",
		},
	});

	if (!isActive || isPremiumUser) {
		return renderUnlocked ? renderUnlocked(isPremiumUser) : children;
	}

	const handleModalClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsModalOpen(true);
	};

	const onSubmit = async (values: z.infer<typeof emailFormSchema>) => {
		startTransition(async () => {
			try {
				const { isPremium, messageId } = await checkPremiumByEmail(values.email);

				if (isPremium && messageId) {
					await activatePremium(messageId);
					setSubmitSuccess(true);
				} else {
					form.setError("email", {
						message: t("errors.notFound"),
					});
					return;
				}
			} catch (_) {
				form.setError("email", {
					message: t("errors.generic"),
				});
			}
		});
	};

	const isLoading = isPending || isPremiumUserLoading;

	const premiumLockContent = (
		<div
			className={mergeClasses(
				"relative",
				variant === "default"
					? "w-full h-full overflow-hidden"
					: variant === "stacked"
						? "w-full h-full flex justify-center items-center"
						: "w-4 h-4",
			)}
		>
			<div
				className={mergeClasses(
					"pointer-events-none",
					variant === "default" && "opacity-90 filter blur-[1px] flex items-center justify-center",
					variant === "small" && "opacity-70 filter blur-[2px] flex items-center justify-center",
				)}
			>
				{children}
			</div>
			<button
				type="button"
				className={mergeClasses(
					"absolute inset-0 z-10 cursor-pointer flex flex-col items-center justify-center",
					variant === "default" && "bg-white/30 dark:bg-black/30 backdrop-blur-[2px] rounded-md",
					variant === "small" && "bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-md",
				)}
				onClick={handleModalClick}
			>
				{variant !== "stacked" && (
					<>
						<div
							className={mergeClasses(
								"w-10 h-10 rounded-full flex items-center justify-center",
								variant === "default" && "bg-primary/50 mb-2",
							)}
						>
							<LockIcon
								className={mergeClasses("w-5 h-5", variant === "small" ? "text-black" : "text-white")}
								size={20}
							/>
						</div>
						{featureName && variant === "default" && <p className="text-sm font-medium">{featureName}</p>}
						{featureDescription && variant === "default" && (
							<p className="text-xs text-muted-foreground">{featureDescription}</p>
						)}
					</>
				)}
			</button>
			{variant === "stacked" && !isPremiumUser && <LockIcon size={16} />}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{submitSuccess ? t("modal.successTitle") : t("modal.title")}</DialogTitle>
						<DialogDescription>
							{submitSuccess ? t("modal.successDescription") : t("modal.description")}
						</DialogDescription>
					</DialogHeader>
					{!submitSuccess ? (
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("modal.emailLabel")}</FormLabel>
											<Input
												{...field}
												type="email"
												placeholder={t("modal.emailPlaceholder")}
												autoComplete="off"
												disabled={isLoading}
											/>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									disabled={isLoading}
									className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors"
								>
									{isLoading ? t("modal.verifying") : t("modal.verify")}
								</Button>
							</form>
						</Form>
					) : (
						<p className="text-green-600 dark:text-green-400 mt-2">{t("modal.successMessage")}</p>
					)}
					<DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
						<X className="h-4 w-4" />
						<span className="sr-only">{t("modal.close")}</span>
					</DialogClose>
				</DialogContent>
			</Dialog>
		</div>
	);

	if (variant !== "default" && featureDescription) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>{premiumLockContent}</TooltipTrigger>
					<TooltipContent className="max-w-xs text-pretty">{featureDescription}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return premiumLockContent;
};
