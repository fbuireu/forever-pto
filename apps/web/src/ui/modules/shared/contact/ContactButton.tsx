"use client";

import { useHasOpened } from "@ui/hooks/useHasOpened";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";

const ContactModal = dynamic(() => import("./ContactModal").then((module) => ({ default: module.ContactModal })));

export function ContactButton() {
	const t = useTranslations("footer");
	const [open, setOpen] = useState(false);
	const hasOpened = useHasOpened(open);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="text-sm font-medium px-1.5 py-0.5 quiet-link cursor-pointer"
			>
				{t("contactUs")}
			</button>
			{hasOpened && <ContactModal open={open} onClose={() => setOpen(false)} />}
		</>
	);
}
