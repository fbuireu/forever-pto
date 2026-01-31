import { createPayment } from '@application/use-cases/payment';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { type NextRequest, NextResponse } from 'next/server';

const logger = getBetterStackInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await createPayment(body, {
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.logError('Payment API error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
