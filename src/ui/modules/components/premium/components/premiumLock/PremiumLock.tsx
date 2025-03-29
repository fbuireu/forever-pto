"use client";

import { DialogClose } from "@modules/components/core/dialog/atoms/dialogClose/DialogClose";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogDescription } from "@modules/components/core/dialog/atoms/dialogDescription/DialogDescription";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { DialogTitle } from "@radix-ui/react-dialog";
import { usePremium } from "@ui/hooks/usePremium/usePremium";
import { Button } from "@ui/modules/components/core/button/Button";
import { Dialog } from "@ui/modules/components/core/dialog/Dialog";
import { Input } from "@ui/modules/components/core/input/Input";
import { Label } from "@ui/modules/components/core/label/Label";
import { LockIcon, X } from "lucide-react";
import { type FormEvent, type MouseEvent, type ReactNode, useState, useTransition } from "react";

interface PremiumLockProps {
	children: ReactNode;
	isActive?: boolean;
	featureName?: string;
	description?: string;
	renderUnlocked?: (isPremium: boolean) => ReactNode;
}

export const PremiumLock = ({
	children,
	isActive = true,
	featureName = "Función Premium",
	description = "Para acceder a esta función premium, introduce tu email para comenzar tu suscripción.",
	renderUnlocked,
}: PremiumLockProps) => {
	const { isPremiumUser, isPremiumUserLoading, activatePremium } = usePremium();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [submitSuccess, setSubmitSuccess] = useState(false);
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

		startTransition(async () => {
			try {
				await new Promise((resolve) => setTimeout(resolve, 1500));
				await activatePremium();

				setSubmitSuccess(true);

				setTimeout(() => {
					setIsModalOpen(false);
					setSubmitSuccess(false);
				}, 2000);
			} catch (error) {}
		});
	};

	const isLoading = isPending || isPremiumUserLoading;

	return (
		<div className="relative overflow-hidden w-full h-full">
			<div className="pointer-events-none opacity-70 filter blur-[2px] scale-[1.05] transform origin-center absolute inset-0 w-[105%] h-[105%] -left-[2.5%] -top-[2.5%]">
				{children}
			</div>
			<div className="invisible">{children}</div>
			<button
				type="button"
				className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-md flex flex-col items-center justify-center cursor-pointer"
				onClick={handleModalClick}
			>
				<div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center mb-2">
					<LockIcon className="w-5 h-5 text-white" />
				</div>
				<p className="text-sm font-medium">{featureName}</p>
				<p className="text-xs text-muted-foreground">Clic para desbloquear</p>
			</button>
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{submitSuccess ? "¡Suscripción exitosa!" : "Desbloquea funciones premium"}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
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
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors"
							>
								{isLoading ? "Procesando..." : "Suscribirse"}
							</Button>
						</form>
					) : (
						<p className="text-green-600 dark:text-green-400 mt-2">
							Tu suscripción se ha activado correctamente. ¡Disfruta de todas las funciones premium!
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
