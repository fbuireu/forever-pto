import { paymentDTO } from '@application/dto/payment/dto';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { amount, email } = await request.json();

    if (amount <= 0 || amount > 10000) {
      return Response.json(
        paymentDTO.create({
          raw: {
            type: 'error',
            error: new Error('Invalid amount. Must be between 0.01 and 10,000'),
          },
        })
      );
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json(
        paymentDTO.create({
          raw: {
            type: 'error',
            error: new Error('Valid email is required'),
          },
        })
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'eur',
      metadata: {
        type: 'donation',
        email,
        timestamp: new Date().toISOString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return Response.json(
      paymentDTO.create({
        raw: { type: 'success', data: paymentIntent },
      })
    );
  } catch (error) {
    return Response.json(
      paymentDTO.create({
        raw: { type: 'error', error },
      })
    );
  }
}
