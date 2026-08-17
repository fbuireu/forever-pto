'use client';

import { usePremiumStore } from '@application/stores/premium';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';

const UpgradeModal = dynamic(() => import('./UpgradeModal').then((module) => ({ default: module.UpgradeModal })));

export const PremiumModal = () => {
  const { closeModal, verifyEmail, modalOpen, currentFeature, isLoading } = usePremiumStore(
    useShallow((state) => ({
      closeModal: state.closeModal,
      verifyEmail: state.verifyEmail,
      modalOpen: state.modalOpen,
      currentFeature: state.currentFeature,
      isLoading: state.isLoading,
    }))
  );

  return (
    <UpgradeModal
      open={modalOpen}
      onClose={closeModal}
      feature={currentFeature}
      onVerifyEmail={verifyEmail}
      isLoading={isLoading}
    />
  );
};
