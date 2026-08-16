import type { ContactFormData } from '@application/dto/contact/schema';
import { sendContactRequest } from '@infrastructure/api/operations/contact';
import { parseJsonBody } from '@infrastructure/api/parseJsonBody';
import { getRequestPublicEnv } from '@infrastructure/services/env/getRequestPublicEnv';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { status, body } = await sendContactRequest(parseJsonBody<ContactFormData>(request), getRequestPublicEnv());

  return NextResponse.json(body, { status });
}
