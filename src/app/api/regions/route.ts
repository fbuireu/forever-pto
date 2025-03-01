import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json(
      { error: 'Se requiere parámetro "country"' },
      { status: 400 }
    );
  }
  console.log('country!', country);
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        country
      })
    });

    const data = await response.json();
    console.log('data', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error al obtener regiones para ${country}:`, error);
    return NextResponse.json(
      { error: 'Error al obtener regiones' },
      { status: 500 }
    );
  }
}
