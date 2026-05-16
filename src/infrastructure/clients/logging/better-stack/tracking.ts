declare global {
  interface Window {
    betterstack?: (command: string, ...args: unknown[]) => void;
  }
}

type TrackEventName =
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'promo_code_applied'
  | 'premium_activated'
  | 'upgrade_modal_opened'
  | 'feature_unlocked'
  | 'planner_generated'
  | 'contact_form_submitted';

interface TrackProperties {
  [key: string]: unknown;
}

export const track = (event: TrackEventName, properties?: TrackProperties) => {
  if (typeof globalThis.window === 'undefined' || !globalThis.window.betterstack) return;
  globalThis.window.betterstack('track', event, properties);
};

export const identifyUser = (email: string, plan: 'premium' | 'free') => {
  if (typeof globalThis.window === 'undefined' || !globalThis.window.betterstack) return;
  globalThis.window.betterstack('user', { email, plan });
};
