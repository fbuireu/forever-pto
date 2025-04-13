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
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Unlock Premium Features',
          'floating-chat.donateButton.background-color': '#5cb85c',
          'floating-chat.donateButton.text-color': '#fff'
        });`}
			</Script>
		</>
	);
};
