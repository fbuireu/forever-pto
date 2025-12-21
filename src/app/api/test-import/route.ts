import { NextResponse } from 'next/server';

console.log('[test-import] Module loaded');

export async function GET() {
  console.log('[test-import] GET handler called');

  try {
    console.log('[test-import] Attempting to import payment use-case...');
    const module = await import('@application/use-cases/payment');
    console.log('[test-import] ✓ Payment use-case imported successfully');

    return NextResponse.json({
      success: true,
      message: 'Payment use-case imported successfully',
      exports: Object.keys(module),
    });
  } catch (error) {
    console.error('[test-import] ✗ Failed to import payment use-case:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to import payment use-case',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
