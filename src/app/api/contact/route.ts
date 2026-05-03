import { sendContactEmail } from '@application/use-cases/contact';
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
        ValidationError: (e) =>
          Effect.succeed(NextResponse.json({ success: false, error: e.message }, { status: 400 })),
        EmailError: (e) => Effect.succeed(NextResponse.json({ success: false, error: e.message }, { status: 500 })),
      }),
      Effect.catchAll(() =>
        Effect.succeed(NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 }))
      )
    )
  );
}
