import { NextResponse } from 'next/server';

// Cache de datos para reducir llamadas a la API externa
let countriesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

export async function GET() {
  try {
    // Verificar si tenemos datos en caché válidos
    const now = Date.now();
    if (countriesCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      return NextResponse.json(countriesCache);
    }

    // Obtener datos de la API de REST Countries (gratuita y confiable)
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }

    const data = await response.json();

    // Transformar los datos al formato que necesitamos
    const countries = data.map(country => ({
      value: country.cca2.toLowerCase(), // código ISO de país en minúsculas
      label: country.name.common,
      flagUrl: country.flags.svg // URL de la bandera en SVG
    })).sort((a, b) => a.label.localeCompare(b.label)); // Ordenar alfabéticamente

    countriesCache = countries;
    cacheTimestamp = now;

    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error al obtener datos de países:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los datos de países' },
      { status: 500 }
    );
  }
}