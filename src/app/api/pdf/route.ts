import type { GeneratePdfOptions } from '@infrastructure/services/export/generatePdf';
import { generatePdfBuffer } from '@infrastructure/services/export/generatePdf';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Effect } from 'effect';

const logger = getBetterStackInstance();
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const options: GeneratePdfOptions = {
    ...body,
    holidays: body.holidays.map((h: Record<string, unknown>) => ({ ...h, date: new Date(h.date as string) })),
    ptoDays: body.ptoDays.map((d: string) => new Date(d)),
  };

  return Effect.runPromise(
    Effect.tryPromise(() => generatePdfBuffer(options)).pipe(
      Effect.map(
        (buffer) =>
          new Response(new Uint8Array(buffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="forever-pto-${options.year}.pdf"`,
            },
          })
      ),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          logger.logError('PDF generation failed', error, { route: '/api/pdf' });
          return NextResponse.json({ error: 'internal_error' }, { status: 500 });
        })
      )
    )
  );
}
