"use client";

import { Button } from "@modules/components/core/button/Button";
import { Dialog } from "@modules/components/core/dialog/Dialog";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogFooter } from "@modules/components/core/dialog/atoms/dialogFooter/DialogFooter";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { DialogTitle } from "@modules/components/core/dialog/atoms/dialogTitle/DialogTitle";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm }: ConfirmModalProps) => {
	const t = useTranslations("confirmModal");

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-destructive" />
						<DialogTitle>{t("title")}</DialogTitle>
					</div>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						{t("cancel")}
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						{t("confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
