import type { CapitalizeKeys } from "@const/types";

export interface KofiWidget {
	src: string;
	username?: string;
	type: "floating-chat";
	donate_button: {
		text_color: string;
	};
}

export const KOFFI_WIDGET: CapitalizeKeys<KofiWidget> = {
	SRC: "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js",
	USERNAME: process.env.NEXT_PUBLIC_KOFI_USERNAME,
	TYPE: "floating-chat",
	DONATE_BUTTON: {
		TEXT_COLOR: "#ffffff",
	},
};
