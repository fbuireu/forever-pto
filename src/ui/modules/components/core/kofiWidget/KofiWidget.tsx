"use client";

import { KOFFI_WIDGET } from "@const/const";
import { useTranslations } from "next-intl";
import Script from "next/script";

export const KofiWidget = () => {
	const t = useTranslations("payments");
	return (
		<>
			<Script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js" strategy="beforeInteractive" />
			<Script id="kofi-donations" strategy="beforeInteractive">
				{`kofiWidgetOverlay.draw('${KOFFI_WIDGET.USERNAME}', {
                    'type': '${KOFFI_WIDGET.TYPE}',
                    'floating-chat.donateButton.text': '${t("cta")}',
                    'floating-chat.donateButton.text-color': '${KOFFI_WIDGET.DONATE_BUTTON.TEXT_COLOR}'
                   });`}
			</Script>
		</>
	);
};
