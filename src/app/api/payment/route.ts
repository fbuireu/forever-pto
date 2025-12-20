export const runtime = 'edge';

import { createPayment } from '@application/use-cases/payment';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') ?? null;
    const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null;

    const result = await createPayment(body, userAgent, ipAddress);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
