"use client";

import { checkPremiumByEmail } from "@application/actions/premium";
import { usePremiumStore } from "@application/stores/premium/premiumStore";
import { DialogClose } from "@modules/components/core/dialog/atoms/dialogClose/DialogClose";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogDescription } from "@modules/components/core/dialog/atoms/dialogDescription/DialogDescription";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "@ui/modules/components/core/button/Button";
import { Dialog } from "@ui/modules/components/core/dialog/Dialog";
import { Input } from "@ui/modules/components/core/input/Input";
import { Label } from "@ui/modules/components/core/label/Label";
import { mergeClasses } from "@ui/utils/mergeClasses";
import { LockIcon, X } from "lucide-react";
import { type FormEvent, type MouseEvent, type ReactNode, useState, useTransition } from "react";

interface PremiumLockProps {
	children: ReactNode;
	isActive?: boolean;
	featureName?: string;
	description?: string;
	renderUnlocked?: (isPremium: boolean) => ReactNode;
	variant?: "small" | "default" | "stacked";
}

export const PremiumLock = ({
	children,
	isActive = true,
	featureName,
	description,
	renderUnlocked,
	variant = "default",
}: PremiumLockProps) => {
	const { isPremiumUser, isPremiumUserLoading, activatePremium } = usePremiumStore();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	if (!isActive || isPremiumUser) {
		return renderUnlocked ? renderUnlocked(isPremiumUser) : children;
	}

	const handleModalClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsModalOpen(true);
	};

	const handleSubmitEmail = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			try {
				const { isPremium, messageId } = await checkPremiumByEmail(email);

				if (isPremium && messageId) {
					await activatePremium(messageId);
					setSubmitSuccess(true);
					setError(null);
				} else {
					setSubmitSuccess(false);
					setError(
						"No se ha encontrado ninguna suscripción premium con este email. Si ya has realizado un pago, asegúrate de usar el mismo email que utilizaste en Ko-fi.",
					);
					return;
				}
			} catch (_) {
				setError("Ha ocurrido un error al verificar tu suscripción. Por favor, inténtalo de nuevo más tarde.");
			}
		});
	};

	const isLoading = isPending || isPremiumUserLoading;

	return (
		<div
			className={mergeClasses(
				"relative",
				variant === "default"
					? "w-full h-full overflow-hidden"
					: variant === "stacked"
						? "w-full h-full flex"
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
						{description && variant === "default" && (
							<p className="text-xs text-muted-foreground">Clic para verificar tu suscripción</p>
						)}
					</>
				)}
			</button>
			{variant === "stacked" && !isPremiumUser && <LockIcon />}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{submitSuccess ? "¡Suscripción verificada!" : "Verifica tu suscripción premium"}</DialogTitle>
						<DialogDescription>
							{submitSuccess
								? "Tu suscripción premium ha sido verificada correctamente. ¡Disfruta de todas las funciones premium!"
								: "Introduce el email que utilizaste en Ko-fi para verificar tu suscripción premium."}
						</DialogDescription>
					</DialogHeader>
					{!submitSuccess ? (
						<form onSubmit={handleSubmitEmail} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									placeholder="tu@email.com"
									autoComplete="off"
									disabled={isLoading}
								/>
							</div>
							{error && <p className="text-red-500 text-sm">{error}</p>}
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors"
							>
								{isLoading ? "Verificando..." : "Verificar suscripción"}
							</Button>
						</form>
					) : (
						<p className="text-green-600 dark:text-green-400 mt-2">
							Tu suscripción premium ha sido verificada correctamente. ¡Disfruta de todas las funciones premium!
						</p>
					)}
					<DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
						<X className="h-4 w-4" />
						<span className="sr-only">Cerrar</span>
					</DialogClose>
				</DialogContent>
			</Dialog>
		</div>
	);
};
