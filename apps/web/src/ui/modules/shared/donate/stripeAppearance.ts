import type { Appearance } from "@stripe/stripe-js";

const LIGHT_PALETTE = {
	surface: "#FFFDF8",
	surfaceHover: "#FFF5E1",
	input: "#FFFAF0",
	foreground: "#0E0E0E",
	frame: "#0E0E0E",
	primaryForeground: "#FFFAF0",
	accent: "#FFD93D",
	accentForeground: "#0E0E0E",
	destructive: "#D32F2F",
	muted: "#6B5E4E",
	ring: "#FF7A45",
};

const DARK_PALETTE: typeof LIGHT_PALETTE = {
	surface: "#1A1612",
	surfaceHover: "#241E18",
	input: "#181410",
	foreground: "#FFF5E1",
	frame: "#FFF5E1",
	primaryForeground: "#0E0E0E",
	accent: "#FFD93D",
	accentForeground: "#0E0E0E",
	destructive: "#D32F2F",
	muted: "#C6B8A5",
	ring: "#FF7A45",
};

const FONT_SIZE_DESKTOP = "14px";
const FONT_SIZE_MOBILE = "16px";

const shadow = ({ offset, color }: { offset: number; color: string }) => `${offset}px ${offset}px 0 0 ${color}`;

const focusRing = ({ base, surface, ring }: { base: string; surface: string; ring: string }) =>
	`${base}, 0 0 0 2px ${surface}, 0 0 0 5px ${ring}`;

interface StripeAppearanceParams {
	isDark: boolean;
	isMobile: boolean;
}

export const stripeAppearance = ({ isDark, isMobile }: StripeAppearanceParams): Appearance => {
	const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
	const fontSize = isMobile ? FONT_SIZE_MOBILE : FONT_SIZE_DESKTOP;
	const frameBorder = { borderWidth: "3px", borderStyle: "solid", borderColor: palette.frame, borderRadius: "8px" };
	const button = {
		...frameBorder,
		backgroundColor: palette.surface,
		color: palette.foreground,
		boxShadow: shadow({ offset: 5, color: palette.frame }),
		fontSize: FONT_SIZE_DESKTOP,
		fontWeight: "900",
		letterSpacing: "0.01em",
		transition: "box-shadow 75ms linear, background-color 75ms linear",
	};
	const buttonHover = {
		backgroundColor: palette.surfaceHover,
		color: palette.foreground,
		boxShadow: shadow({ offset: 7, color: palette.frame }),
	};
	const buttonFocus = {
		boxShadow: focusRing({
			base: shadow({ offset: 5, color: palette.frame }),
			surface: palette.surface,
			ring: palette.ring,
		}),
		outline: "none",
	};
	const buttonSelected = {
		backgroundColor: palette.frame,
		color: palette.primaryForeground,
		borderColor: palette.frame,
		boxShadow: shadow({ offset: 3, color: palette.accent }),
	};
	const buttonSelectedHover = { boxShadow: shadow({ offset: 5, color: palette.accent }) };

	return {
		theme: undefined,
		labels: "above",
		variables: {
			colorBackground: palette.surface,
			colorText: palette.foreground,
			colorPrimary: palette.frame,
			colorDanger: palette.destructive,
			colorTextSecondary: palette.muted,
			colorTextPlaceholder: palette.muted,
			accessibleColorOnColorPrimary: palette.primaryForeground,
			fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
			fontSizeBase: fontSize,
			fontWeightNormal: "400",
			fontWeightMedium: "500",
			fontWeightBold: "900",
			fontLineHeight: "20px",
			spacingUnit: "4px",
			borderRadius: "8px",
			focusBoxShadow: shadow({ offset: 4, color: palette.frame }),
			focusOutline: "none",
		},
		rules: {
			".Input": {
				...frameBorder,
				backgroundColor: palette.input,
				color: palette.foreground,
				padding: "9px 16px",
				fontSize,
				lineHeight: "20px",
				boxShadow: "none",
				transition: "box-shadow 75ms linear",
			},
			".Input:hover": { boxShadow: shadow({ offset: 2, color: palette.frame }) },
			".Input:focus": { boxShadow: shadow({ offset: 4, color: palette.frame }), outline: "none" },
			".Input--invalid": { borderColor: palette.destructive, boxShadow: "none" },
			".Input--invalid:hover": { boxShadow: "none" },
			".Input--invalid:focus": { boxShadow: shadow({ offset: 4, color: palette.destructive }) },
			".Input::placeholder": { color: palette.muted },
			".Label": {
				fontSize: FONT_SIZE_DESKTOP,
				fontWeight: "500",
				lineHeight: "1",
				color: palette.foreground,
				marginBottom: "8px",
			},
			".Error": { fontSize: FONT_SIZE_DESKTOP, fontWeight: "400", color: palette.destructive, marginTop: "8px" },
			".Tab": { ...button, padding: "10px 16px" },
			".Tab:hover": buttonHover,
			".Tab:focus": buttonFocus,
			".Tab--selected": buttonSelected,
			".Tab--selected:hover": buttonSelectedHover,
			".Tab--selected:focus": {
				boxShadow: focusRing({
					base: shadow({ offset: 3, color: palette.accent }),
					surface: palette.surface,
					ring: palette.ring,
				}),
			},
			".TabIcon--selected": { color: palette.primaryForeground },
			".TabLabel--selected": { color: palette.primaryForeground },
			".PickerItem": { ...button, padding: "10px 16px" },
			".PickerItem:hover": buttonHover,
			".PickerItem:focus": buttonFocus,
			".PickerItem--selected": buttonSelected,
			".PickerItem--selected:hover": buttonSelectedHover,
			".Block": { ...frameBorder, backgroundColor: palette.surface, boxShadow: "none" },
			".AccordionItem": { ...frameBorder, backgroundColor: palette.surface, boxShadow: "none" },
			".AccordionItem:focus-within": { boxShadow: shadow({ offset: 4, color: palette.frame }) },
			".CheckboxInput": {
				border: `2px solid ${palette.frame}`,
				borderRadius: "4px",
				backgroundColor: palette.input,
			},
			".CheckboxInput--checked": { backgroundColor: palette.frame, borderColor: palette.frame },
		},
	};
};
