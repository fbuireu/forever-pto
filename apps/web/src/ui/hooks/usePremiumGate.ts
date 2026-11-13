import { type PremiumFeatureId, type PremiumOrigin, usePremiumStore } from "@application/stores/premium";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

interface UsePremiumGateParams {
	feature: PremiumFeatureId;
	origin: PremiumOrigin;
}

interface PremiumGate {
	isLocked: boolean;
	unlock: () => void;
}

export const usePremiumGate = ({ feature, origin }: UsePremiumGateParams): PremiumGate => {
	const { premiumKey, showPremiumModal, checkExistingSession } = usePremiumStore(
		useShallow((state) => ({
			premiumKey: state.premiumKey,
			showPremiumModal: state.showPremiumModal,
			checkExistingSession: state.checkExistingSession,
		})),
	);

	useEffect(() => {
		checkExistingSession();
	}, [checkExistingSession]);

	return { isLocked: !premiumKey, unlock: () => showPremiumModal({ feature, origin }) };
};
