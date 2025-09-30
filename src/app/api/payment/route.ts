import { paymentDTO } from '@application/dto/payment/dto';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { amount, email, name, promoCode } = await request.json();

    if (!amount || amount <= 0 || amount > 10000) {
      return Response.json(
        paymentDTO.create({
          raw: {
            type: 'error',
            error: new Error('Invalid amount. Must be between 0.01 and 10,000'),
          },
        }),
        { status: 400 }
      );
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json(
        paymentDTO.create({
          raw: {
            type: 'error',
            error: new Error('Valid email is required'),
          },
        }),
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'eur',
      description: `Donation from ${email}`,
      receipt_email: email, 
      metadata: {
        type: 'donation',
        email,
        name: name || '',
        promoCode: promoCode || '',
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') || '',
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          'unknown',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return Response.json(
      paymentDTO.create({
        raw: {
          type: 'success',
          data: paymentIntent
        },
      })
    );
  } catch (error) {
    console.error('Payment creation error:', error);

    return Response.json(
      paymentDTO.create({
        raw: {
          type: 'error',
          error: error instanceof Error ? error : new Error('Unknown error occurred'),
        },
      }),
      { status: 500 }
    );
  }
}
