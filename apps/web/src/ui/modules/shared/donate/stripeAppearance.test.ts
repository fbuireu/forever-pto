import { describe, expect, it } from "vitest";
import { stripeAppearance, stripeFonts } from "./stripeAppearance";

describe("stripeAppearance", () => {
	it("draws a field like the sidebar's controls: a resting frame shadow that grows on hover", () => {
		const { rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(rules?.[".Input"]).toMatchObject({
			borderWidth: "3px",
			borderRadius: "8px",
			backgroundColor: "#FFFDF8",
			boxShadow: "5px 5px 0 0 #0E0E0E",
		});
		expect(rules?.[".Input:hover"]).toEqual({ backgroundColor: "#FFF5E1", boxShadow: "7px 7px 0 0 #0E0E0E" });
		expect(rules?.[".Input:focus"]?.boxShadow).toBe("0 0 0 2px #FFFDF8, 0 0 0 5px #FF7A45, 5px 5px 0 0 #0E0E0E");
		expect(rules?.[".Input--invalid"]).toMatchObject({ borderColor: "#D32F2F", boxShadow: "5px 5px 0 0 #D32F2F" });
	});

	it("labels in the sidebar's mono face, without shouting", () => {
		const { rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(rules?.[".Label"]).toMatchObject({ fontSize: "14px", fontWeight: "400" });
		expect(rules?.[".Label"]?.fontFamily).toContain("monospace");
		expect(rules?.[".Label"]).not.toHaveProperty("textTransform");
	});

	it("draws a payment method like a sidebar card", () => {
		const { rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(rules?.[".AccordionItem"]).toMatchObject({
			borderRadius: "14px",
			backgroundColor: "#FFF5E1",
			boxShadow: "6px 6px 0 0 #0E0E0E",
			padding: "18px",
		});
	});

	it("selects a picker item at the same depth as an unselected one, ink with an accent shadow", () => {
		const { rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(rules?.[".PickerItem"]).toMatchObject({ boxShadow: "5px 5px 0 0 #0E0E0E" });
		expect(rules?.[".PickerItem--selected"]).toMatchObject({
			backgroundColor: "#0E0E0E",
			color: "#FFFAF0",
			boxShadow: "5px 5px 0 0 #FFD93D",
		});
		expect(rules?.[".PickerItem--selected:hover"]).toEqual({ boxShadow: "7px 7px 0 0 #FFD93D" });
	});

	it("keeps the selected payment method's icon in the frame colour, visible on the card", () => {
		const { variables, rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(variables?.colorIconTabSelected).toBe("#0E0E0E");
		expect(rules?.[".TabIcon--selected"]).toEqual({ color: "#0E0E0E" });
	});

	it("switches to the dark tokens", () => {
		const { variables, rules } = stripeAppearance({ isDark: true, isMobile: false });

		expect(variables).toMatchObject({ colorBackground: "#1A1612", colorText: "#FFF5E1" });
		expect(rules?.[".AccordionItem"]).toMatchObject({ backgroundColor: "#141008" });
		expect(rules?.[".PickerItem--selected"]).toMatchObject({ backgroundColor: "#FFF5E1", color: "#0E0E0E" });
	});

	it("keeps the input text at 16px on phones so the browser does not zoom", () => {
		const { variables, rules } = stripeAppearance({ isDark: false, isMobile: true });

		expect(variables?.fontSizeBase).toBe("16px");
		expect(rules?.[".Input"]).toMatchObject({ fontSize: "16px" });
	});

	it("types in the app's own faces, loaded from this origin's copy", () => {
		const { variables, rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(variables?.fontFamily?.startsWith('"Space Grotesk"')).toBe(true);
		expect(rules?.[".Label"]?.fontFamily?.startsWith('"JetBrains Mono"')).toBe(true);
		expect(stripeFonts("https://forever-pto.com")).toEqual([
			{ cssSrc: "https://forever-pto.com/fonts/stripe/fonts.css" },
		]);
	});
});
