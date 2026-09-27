import { describe, expect, it } from "vitest";
import { stripeAppearance } from "./stripeAppearance";

describe("stripeAppearance", () => {
	it("draws inputs like the Input primitive", () => {
		const { rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(rules?.[".Input"]).toMatchObject({ borderWidth: "3px", borderRadius: "8px", padding: "9px 16px" });
		expect(rules?.[".Input:hover"]).toEqual({ boxShadow: "2px 2px 0 0 #0E0E0E" });
		expect(rules?.[".Input:focus"]).toMatchObject({ boxShadow: "4px 4px 0 0 #0E0E0E" });
		expect(rules?.[".Input--invalid:focus"]).toEqual({ boxShadow: "4px 4px 0 0 #D32F2F" });
	});

	it("labels like the Label primitive, without shouting", () => {
		const { rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(rules?.[".Label"]).toMatchObject({ fontSize: "14px", fontWeight: "500" });
		expect(rules?.[".Label"]).not.toHaveProperty("textTransform");
	});

	it("selects a tab the way a selected Button is drawn, ink with an accent shadow", () => {
		const { rules } = stripeAppearance({ isDark: false, isMobile: false });

		expect(rules?.[".Tab"]).toMatchObject({ boxShadow: "5px 5px 0 0 #0E0E0E" });
		expect(rules?.[".Tab:hover"]).toMatchObject({ boxShadow: "7px 7px 0 0 #0E0E0E" });
		expect(rules?.[".Tab--selected:hover"]).toEqual({ boxShadow: "7px 7px 0 0 #FFD93D" });
		expect(rules?.[".Tab--selected"]).toMatchObject({
			backgroundColor: "#0E0E0E",
			color: "#FFFAF0",
			boxShadow: "5px 5px 0 0 #FFD93D",
		});
	});

	it("switches to the dark tokens", () => {
		const { variables, rules } = stripeAppearance({ isDark: true, isMobile: false });

		expect(variables).toMatchObject({ colorBackground: "#1A1612", colorText: "#FFF5E1" });
		expect(rules?.[".Tab--selected"]).toMatchObject({ backgroundColor: "#FFF5E1", color: "#0E0E0E" });
	});

	it("keeps the input text at 16px on phones so the browser does not zoom", () => {
		const { variables, rules } = stripeAppearance({ isDark: false, isMobile: true });

		expect(variables?.fontSizeBase).toBe("16px");
		expect(rules?.[".Input"]).toMatchObject({ fontSize: "16px" });
	});
});
