import type { ContactFormData } from '@application/dto/contact/schema';
import { sendContactRequest } from '@infrastructure/api/operations/contact';
import { parseJsonBody } from '@infrastructure/api/parseJsonBody';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  const { status, body } = await sendContactRequest(parseJsonBody<ContactFormData>(request), {
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL,
  });

  return NextResponse.json(body, { status });
}
