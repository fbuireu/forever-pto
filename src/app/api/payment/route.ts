import { createPayment } from '@application/use-cases/payment';
import { type NextRequest, NextResponse } from 'next/server';

console.log('[api/payment/route.ts] Module loaded');

export async function POST(request: NextRequest) {
  console.log('[api/payment] POST request received');
  try {
    console.log('[api/payment] Parsing request body...');
    const body = await request.json();
    console.log('[api/payment] Body parsed:', { hasEmail: !!body.email, hasAmount: !!body.amount });

    console.log('[api/payment] Calling createPayment use-case...');
    const result = await createPayment(body, {
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
    });
    console.log('[api/payment] Use-case returned:', { success: result.success });

    if (!result.success) {
      console.log('[api/payment] Returning 400 error response');
      return NextResponse.json(result, { status: 400 });
    }

    console.log('[api/payment] Returning success response');
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/payment] ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
