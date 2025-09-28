import { PremiumFeatureVariant } from "../PremiumFeature";

export const getButtonClass = (variant: PremiumFeatureVariant) => {
    switch (variant) {
      case PremiumFeatureVariant.STACK:
        return 'p-2 rounded-full cursor-pointer m-0 w-fit';
      case PremiumFeatureVariant.DEFAULT:
      default:
        return 'p-2 w-full rounded-full cursor-pointer backdrop-blur-sm m-0';
    }
  };