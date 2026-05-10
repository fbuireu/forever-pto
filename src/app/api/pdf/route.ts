import type { GeneratePdfOptions } from '@infrastructure/services/export/generatePdf';
import { generatePdfBuffer } from '@infrastructure/services/export/generatePdf';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const options: GeneratePdfOptions = {
    ...body,
    holidays: body.holidays.map((h: Record<string, unknown>) => ({ ...h, date: new Date(h.date as string) })),
    ptoDays: body.ptoDays.map((d: string) => new Date(d)),
  };

  const buffer = await generatePdfBuffer(options);

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="forever-pto-${options.year}.pdf"`,
    },
  });
}
