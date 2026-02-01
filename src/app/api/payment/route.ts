import { createPayment } from '@application/use-cases/payment';
import { createDefaultDependencies } from '@infrastructure/container/create-dependencies';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const deps = createDefaultDependencies();

  try {
    const body = await request.json();

    const result = await createPayment(
      body,
      {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
      },
      {
        logger: deps.logger,
        paymentRepository: deps.paymentRepository,
        paymentIntentService: deps.paymentIntentService,
        promoCodeService: deps.promoCodeService,
        paymentHelpers: deps.paymentHelpers,
      }
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    deps.logger.logError('Payment API error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
