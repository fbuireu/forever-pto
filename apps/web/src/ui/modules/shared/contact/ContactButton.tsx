"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LazyContactModal } from "./LazyContactModal";

export function ContactButton() {
	const t = useTranslations("footer");
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="text-sm font-medium px-1.5 py-0.5 quiet-link cursor-pointer"
			>
				{t("contactUs")}
			</button>
			<LazyContactModal open={open} onClose={() => setOpen(false)} />
		</>
	);
}
