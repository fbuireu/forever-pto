import type Stripe from 'stripe';

export interface StripeServer {
  paymentIntents: {
    retrieve(id: string): Promise<Stripe.PaymentIntent>;
  };
  charges: {
    retrieve(id: string): Promise<Stripe.Charge>;
  };
  promotionCodes: {
    list(params: Stripe.PromotionCodeListParams): Promise<Stripe.ApiList<Stripe.PromotionCode>>;
  };
  webhooks: {
    constructEvent(
      payload: string | Buffer,
      signature: string,
      secret: string
    ): Stripe.Event;
  };
}
