"use client";

import { usePremiumStore } from "@application/stores/premium";
import { useHasOpened } from "@ui/hooks/useHasOpened";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/react/shallow";

const PremiumRequiredModal = dynamic(() =>
	import("./PremiumRequiredModal").then((module) => ({ default: module.PremiumRequiredModal })),
);

export const PremiumModal = () => {
	const { closeModal, verifyEmail, modalOpen, currentFeature, isLoading } = usePremiumStore(
		useShallow((state) => ({
			closeModal: state.closeModal,
			verifyEmail: state.verifyEmail,
			modalOpen: state.modalOpen,
			currentFeature: state.currentFeature,
			isLoading: state.isLoading,
		})),
	);

	const hasOpened = useHasOpened(modalOpen);
	if (!hasOpened) return null;

	return (
		<PremiumRequiredModal
			open={modalOpen}
			onClose={closeModal}
			feature={currentFeature}
			onVerifyEmail={verifyEmail}
			isLoading={isLoading}
		/>
	);
};
