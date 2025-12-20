export const runtime = 'edge';

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') ?? null;
    const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;

    // Test básico primero
    return NextResponse.json({
      success: true,
      test: true,
      received: { body, userAgent, ipAddress }
    });

    // TODO: Descomentar cuando funcione el test básico
    // const { createPayment } = await import('@application/use-cases/payment');
    // const result = await createPayment(body, userAgent, ipAddress);
    // return NextResponse.json(result);
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
