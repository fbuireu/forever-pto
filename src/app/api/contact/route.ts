import { sendContactEmail } from '@application/use-cases/contact';
import { ApiError } from '@infrastructure/api/errors';
import { AppLayer } from '@infrastructure/layers';
import { Effect } from 'effect';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  return Effect.runPromise(
    sendContactEmail(body).pipe(
      Effect.map(() => NextResponse.json({ success: true })),
      Effect.provide(AppLayer),
      Effect.catchTags({
        ValidationError: (error) =>
          Effect.succeed(NextResponse.json({ success: false, error: error.message }, { status: 400 })),
        EmailError: () => Effect.succeed(NextResponse.json({ success: false, error: ApiError.INTERNAL_ERROR }, { status: 500 })),
      }),
      Effect.catchAll(() =>
        Effect.succeed(NextResponse.json({ success: false, error: ApiError.INTERNAL_ERROR }, { status: 500 }))
      )
    )
  );
}
