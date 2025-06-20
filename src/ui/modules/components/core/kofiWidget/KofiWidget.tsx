"use client";

import { KOFFI_WIDGET } from "@modules/components/core/kofiWidget/const";
import Script from "next/script";
import { useTranslations } from "next-intl";
import { useId } from "react";

export const KofiWidget = () => {
	const t = useTranslations("payments");
	const id = useId();
	return (
		<>
			<Script src={KOFFI_WIDGET.SRC} strategy="beforeInteractive" />
			<Script id={id} strategy="beforeInteractive">
				{`kofiWidgetOverlay.draw('${KOFFI_WIDGET.USERNAME}', {
                    'type': '${KOFFI_WIDGET.TYPE}',
                    'floating-chat.donateButton.text': '${t("cta")}',
                    'floating-chat.donateButton.text-color': '${KOFFI_WIDGET.DONATE_BUTTON.TEXT_COLOR}'
                   });`}
			</Script>
		</>
	);
};
