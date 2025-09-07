'use client';

import { usePremiumStore } from '@application/stores/premium';
import { UpgradeModal } from './UpgradeModal';

export const PremiumModal = () => {
  const { modalOpen, currentFeature, isLoading, closeModal, verifyEmail } = usePremiumStore();

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
