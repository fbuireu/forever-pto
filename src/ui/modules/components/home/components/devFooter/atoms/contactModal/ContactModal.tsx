import { Button } from "@modules/components/core/button/Button";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { DialogTitle } from "@modules/components/core/dialog/atoms/dialogTitle/DialogTitle";
import { useTranslations } from "next-intl";

export const ContactModal = () => {
	const t = useTranslations("modals.contact");

	return (
		<DialogContent className="sm:max-w-md">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<span className="text-2xl">📬</span>
					{t("title")}
				</DialogTitle>
			</DialogHeader>
			<div className="space-y-4 py-4">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">{t("subtitle")}</p>

					<div className="grid gap-3">
						<Button
							variant="outline"
							className="flex items-center justify-center gap-3 p-6 h-auto group"
							onClick={() => {
								window.location.href = `mailto:${t("email.address")}`;
							}}
						>
							<span className="text-xl">📧</span>
							<div className="text-left">
								<div className="font-medium group-hover:text-primary transition-colors">{t("email.label")}</div>
								<div className="text-sm text-muted-foreground">{t("email.description")}</div>
							</div>
						</Button>
						<Button
							variant="outline"
							className="flex items-center justify-center gap-3 p-6 h-auto group"
							onClick={() => {
								window.open("https://github.com/fbuireu", "_blank", "noopener,noreferrer");
							}}
						>
							<span className="text-xl">🐙</span>
							<div className="text-left">
								<div className="font-medium group-hover:text-primary transition-colors">{t("github.label")}</div>
								<div className="text-sm text-muted-foreground">{t("github.username")}</div>
							</div>
						</Button>
						<Button
							variant="outline"
							className="flex items-center justify-center gap-3 p-6 h-auto group"
							onClick={() => {
								window.open("https://twitter.com/ferranbuireu", "_blank", "noopener,noreferrer");
							}}
						>
							<span className="text-xl">🐦</span>
							<div className="text-left">
								<div className="font-medium group-hover:text-primary transition-colors">{t("twitter.label")}</div>
								<div className="text-sm text-muted-foreground">{t("twitter.username")}</div>
							</div>
						</Button>
					</div>
					<div className="pt-4 border-t">
						<p className="text-xs text-muted-foreground">{t("responseTime")}</p>
					</div>
				</div>
			</div>
		</DialogContent>
	);
};
