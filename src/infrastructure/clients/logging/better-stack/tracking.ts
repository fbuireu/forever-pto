declare global {
  interface Window {
    betterstack?: (command: string, ...args: unknown[]) => void;
  }
}

export type TrackEventName =
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'promo_code_applied'
  | 'premium_activated'
  | 'upgrade_modal_opened'
  | 'feature_unlocked'
  | 'planner_generated'
  | 'contact_form_submitted';

export interface TrackProperties {
  [key: string]: unknown;
}

export const track = (event: TrackEventName, properties?: TrackProperties): void => {
  if (typeof window === 'undefined' || !window.betterstack) return;
  window.betterstack('track', event, properties);
};

export const identifyUser = (email: string, plan: 'premium' | 'free'): void => {
  if (typeof window === 'undefined' || !window.betterstack) return;
  window.betterstack('user', { email, plan });
};
