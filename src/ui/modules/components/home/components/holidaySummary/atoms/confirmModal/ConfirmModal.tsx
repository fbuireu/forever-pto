"use client";

import { Button } from "@modules/components/core/button/Button";
import { Dialog } from "@modules/components/core/dialog/Dialog";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogFooter } from "@modules/components/core/dialog/atoms/dialogFooter/DialogFooter";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { DialogTitle } from "@modules/components/core/dialog/atoms/dialogTitle/DialogTitle";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
}

export const ConfirmModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
}: ConfirmModalProps) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-destructive" />
						<DialogTitle>{title}</DialogTitle>
					</div>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">{description}</p>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						{cancelText}
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
