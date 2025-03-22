import { middleware as customMiddleware } from '@infrastructure/middleware/middleware';
import type { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest): Promise<NextResponse> {
	return customMiddleware(request);
}

export const config = {
	matcher: ["/"],
};
