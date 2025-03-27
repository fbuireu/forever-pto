import type { PremiumContextType } from "@ui/providers/premium/types";
import { createContext, useContext } from "react";

export const PremiumContext = createContext<PremiumContextType | null>(null);

export const usePremium = (): PremiumContextType => {
	const context = useContext(PremiumContext);
	if (!context) {
		throw new Error("usePremium must be used inside a PremiumProvider");
	}
	return context;
};
