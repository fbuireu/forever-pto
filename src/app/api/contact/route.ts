import { sendContactEmail } from '@application/use-cases/contact';
import { ApiError } from '@infrastructure/api/errors';
import { ApplicationLayer } from '@infrastructure/layers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Effect } from 'effect';
import { after, type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { env } = getCloudflareContext();

  return Effect.runPromise(
    sendContactEmail(body, { siteUrl: env.NEXT_PUBLIC_SITE_URL, contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL }).pipe(
      Effect.map(({ deferred }) => {
        after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))));
        return NextResponse.json({ success: true });
      }),
      Effect.provide(ApplicationLayer),
      Effect.catchTags({
        ValidationError: (error) =>
          Effect.succeed(NextResponse.json({ success: false, error: error.message }, { status: 400 })),
        EmailError: () =>
          Effect.succeed(NextResponse.json({ success: false, error: ApiError.INTERNAL_ERROR }, { status: 500 })),
      }),
      Effect.catchAll(() =>
        Effect.succeed(NextResponse.json({ success: false, error: ApiError.INTERNAL_ERROR }, { status: 500 }))
      )
    )
  );
}
