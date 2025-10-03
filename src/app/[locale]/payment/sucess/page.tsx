import type Stripe from "stripe";

interface StripeParams {
  payment_intent: string;
}

interface SuccessProps {
  params: Promise<StripeParams>;
}


export const Sucess = async ({ params }: SuccessProps) => {
  const { payment_intent } = await params;
  
  return <div>SucessPage {payment_intent}</div>;
};