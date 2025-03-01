import { NextRequest, NextResponse } from 'next/server';
import { getHolidays } from '@/lib/holidays';

export async function GET(request: NextRequest) {
  // Obtener parámetros de consulta
  const searchParams = request.nextUrl.searchParams;
  const country = searchParams.get('country') || 'es';
  const region = searchParams.get('region') || '';

  // Obtener el año (permitir año actual o especificado)
  const currentYear = new Date().getFullYear();
  const year = parseInt(searchParams.get('year') || currentYear.toString(), 10);

  try {
    // Validar parámetros
    if (!country) {
      return NextResponse.json(
        { error: 'El parámetro "country" es obligatorio' },
        { status: 400 }
      );
    }

    // Validar año
    if (isNaN(year) || year < 2000 || year > 2050) {
      return NextResponse.json(
        { error: 'El año debe estar entre 2000 y 2050' },
        { status: 400 }
      );
    }

    // Obtener festividades desde el servicio
    const holidays = await getHolidays(country, region, year);

    // Convertir fechas a formato ISO para respuesta JSON
    const formattedHolidays = holidays.map(holiday => ({
      date: holiday.date.toISOString(),
      name: holiday.name,
      type: holiday.type || 'Public',
      location: holiday.location || null
    }));

    // Añadir metadatos útiles
    const response = {
      meta: {
        country,
        region: region || null,
        year,
        count: formattedHolidays.length
      },
      holidays: formattedHolidays
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en API de festividades:', error);

    return NextResponse.json(
      { error: 'Error al obtener festividades' },
      { status: 500 }
    );
  }
}