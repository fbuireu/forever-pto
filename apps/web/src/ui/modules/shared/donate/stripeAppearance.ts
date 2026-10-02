import type { Appearance } from "@stripe/stripe-js";

const LIGHT_PALETTE = {
	surface: "#FFFDF8",
	panel: "#FFF5E1",
	field: "#FFFDF8",
	fieldHover: "#FFF5E1",
	foreground: "#0E0E0E",
	frame: "#0E0E0E",
	primaryForeground: "#FFFAF0",
	accent: "#FFD93D",
	destructive: "#D32F2F",
	muted: "#6B5E4E",
	ring: "#FF7A45",
};

const DARK_PALETTE: typeof LIGHT_PALETTE = {
	surface: "#1A1612",
	panel: "#141008",
	field: "#1A1612",
	fieldHover: "#241E18",
	foreground: "#FFF5E1",
	frame: "#FFF5E1",
	primaryForeground: "#0E0E0E",
	accent: "#FFD93D",
	destructive: "#D32F2F",
	muted: "#C6B8A5",
	ring: "#FF7A45",
};

const FONT_SIZE_DESKTOP = "14px";
const FONT_SIZE_MOBILE = "16px";
const SANS_STACK = '"Space Grotesk", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO_STACK = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const FONTS_STYLESHEET = "/fonts/stripe/fonts.css";

export const stripeFonts = (origin: string) => [{ cssSrc: `${origin}${FONTS_STYLESHEET}` }];

const SHADOW = { XS: 2, MD: 6, BUTTON: 5, BUTTON_HOVER: 7 } as const;

interface ShadowParams {
	offset: number;
	color: string;
}

const shadow = ({ offset, color }: ShadowParams) => `${offset}px ${offset}px 0 0 ${color}`;

interface FocusRingParams {
	base: string;
	surface: string;
	ring: string;
}

const focusRing = ({ base, surface, ring }: FocusRingParams) => `0 0 0 2px ${surface}, 0 0 0 5px ${ring}, ${base}`;

interface StripeAppearanceParams {
	isDark: boolean;
	isMobile: boolean;
}

export const stripeAppearance = ({ isDark, isMobile }: StripeAppearanceParams): Appearance => {
	const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
	const fontSize = isMobile ? FONT_SIZE_MOBILE : FONT_SIZE_DESKTOP;
	const frameBorder = { borderWidth: "3px", borderStyle: "solid", borderColor: palette.frame };
	const rest = shadow({ offset: SHADOW.BUTTON, color: palette.frame });
	const lifted = shadow({ offset: SHADOW.BUTTON_HOVER, color: palette.frame });
	const selectedRest = shadow({ offset: SHADOW.BUTTON, color: palette.accent });
	const ringed = (base: string) => focusRing({ base, surface: palette.surface, ring: palette.ring });

	const field = {
		...frameBorder,
		borderRadius: "8px",
		backgroundColor: palette.field,
		color: palette.foreground,
		boxShadow: rest,
		transition: "box-shadow 75ms linear, background-color 75ms linear",
	};
	const fieldHover = { backgroundColor: palette.fieldHover, boxShadow: lifted };
	const fieldFocus = { boxShadow: ringed(rest), outline: "none" };
	const selected = {
		backgroundColor: palette.frame,
		color: palette.primaryForeground,
		borderColor: palette.frame,
		boxShadow: selectedRest,
	};
	const selectedHover = { boxShadow: shadow({ offset: SHADOW.BUTTON_HOVER, color: palette.accent }) };
	const choice = { ...field, fontSize: FONT_SIZE_DESKTOP, fontWeight: "900", padding: "10px 16px" };

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
			colorIconTab: palette.foreground,
			colorIconTabSelected: palette.frame,
			fontFamily: SANS_STACK,
			fontSizeBase: fontSize,
			fontWeightNormal: "400",
			fontWeightMedium: "500",
			fontWeightBold: "900",
			fontLineHeight: "20px",
			spacingUnit: "4px",
			spacingGridRow: "16px",
			spacingAccordionItem: "16px",
			borderRadius: "8px",
			focusBoxShadow: ringed(rest),
			focusOutline: "none",
		},
		rules: {
			".Input": { ...field, padding: "9px 16px", fontSize, fontWeight: "700", lineHeight: "20px" },
			".Input:hover": fieldHover,
			".Input:focus": fieldFocus,
			".Input--invalid": {
				borderColor: palette.destructive,
				boxShadow: shadow({ offset: SHADOW.BUTTON, color: palette.destructive }),
			},
			".Input--invalid:hover": { boxShadow: shadow({ offset: SHADOW.BUTTON_HOVER, color: palette.destructive }) },
			".Input--invalid:focus": {
				boxShadow: ringed(shadow({ offset: SHADOW.BUTTON, color: palette.destructive })),
			},
			".Input::placeholder": { color: palette.muted, fontWeight: "400" },
			".Label": {
				fontFamily: MONO_STACK,
				fontSize: FONT_SIZE_DESKTOP,
				fontWeight: "400",
				color: palette.foreground,
				marginBottom: "8px",
			},
			".Error": { fontSize: FONT_SIZE_DESKTOP, fontWeight: "400", color: palette.destructive, marginTop: "8px" },
			".TabIcon--selected": { color: palette.frame },
			".TabLabel--selected": { color: palette.foreground },
			".PickerItem": choice,
			".PickerItem:hover": { ...fieldHover, color: palette.foreground },
			".PickerItem:focus": fieldFocus,
			".PickerItem--selected": selected,
			".PickerItem--selected:hover": selectedHover,
			".AccordionItem": {
				...frameBorder,
				borderRadius: "14px",
				backgroundColor: palette.panel,
				boxShadow: shadow({ offset: SHADOW.MD, color: palette.frame }),
				padding: "18px",
				fontWeight: "900",
			},
			".AccordionItem:focus-visible": {
				boxShadow: ringed(shadow({ offset: SHADOW.MD, color: palette.frame })),
			},
			".AccordionItem--selected": { fontWeight: "900" },
			".Block": {
				...frameBorder,
				borderRadius: "12px",
				backgroundColor: palette.surface,
				boxShadow: shadow({ offset: SHADOW.XS, color: palette.frame }),
			},
			".CheckboxInput": {
				border: `3px solid ${palette.frame}`,
				borderRadius: "4px",
				backgroundColor: palette.field,
				boxShadow: shadow({ offset: SHADOW.XS, color: palette.frame }),
			},
			".CheckboxInput--checked": { backgroundColor: palette.frame, borderColor: palette.frame },
			".CheckboxInput:focus": { boxShadow: ringed(shadow({ offset: SHADOW.XS, color: palette.frame })) },
		},
	};
};
