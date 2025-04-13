import { KOFFI_WIDGET } from "@const/const";
import Script from "next/script";

interface KofiWidgetProps {
	username: string;
}

export const KofiWidget = ({ username }: KofiWidgetProps) => {
	return (
		<>
			<Script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js" strategy="beforeInteractive" />
			<Script id="kofi-donations" strategy="beforeInteractive">
				{`kofiWidgetOverlay.draw('${username}', {
                    'type': '${KOFFI_WIDGET.TYPE}',
                    'floating-chat.donateButton.text': '${KOFFI_WIDGET.DONATE_BUTTON.TEXT}',
                    'floating-chat.donateButton.text-color': '${KOFFI_WIDGET.DONATE_BUTTON.TEXT_COLOR}'
                   });`}
			</Script>
		</>
	);
};
