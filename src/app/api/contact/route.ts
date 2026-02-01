import { sendContactEmail } from '@application/use-cases/contact';
import { createDefaultDependencies } from '@infrastructure/container/create-dependencies';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const deps = createDefaultDependencies();

  try {
    const { env } = getCloudflareContext();
    const body = await request.json();

    const result = await sendContactEmail(body, {
      logger: deps.logger,
      emailService: deps.emailService,
      emailRenderer: deps.emailRenderer,
      contactRepository: deps.contactRepository,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      recipientEmail: env.NEXT_PUBLIC_EMAIL_SELF,
    });

    return NextResponse.json(result);
  } catch (error) {
    deps.logger.logError('Contact API error', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
