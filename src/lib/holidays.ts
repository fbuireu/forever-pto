import { cache } from 'react';

// Interfaz para la estructura de feriados/festividades
export interface Holiday {
  date: Date;
  name: string;
  type?: string; // nacional, regional, religioso, etc.
  location?: string; // país o región específica
}

// Tipos de APIs utilizados (para mejor mantenimiento)
const HOLIDAY_API_TYPES = {
  NAGER: 'nager',
  CALENDARIFIC: 'calendarific',
  ENRICO: 'enrico'
} as const;


// Convierte códigos ISO a formato específico de cada API
function normalizeCountryCode(code: string, apiType: keyof typeof HOLIDAY_API_TYPES): string {
  const code2 = code.toLowerCase();

  // Mapeos específicos por API
  if (apiType === 'nager') {
    // Nager.Date usa códigos ISO de 2 letras en mayúsculas
    const mapping: Record<string, string> = {
      'uk': 'GB' // Reino Unido es GB en ISO 3166-1
    };

    return mapping[code2] || code2.toUpperCase();
  }

  // Calendarific usa códigos ISO de 2 letras
  if (apiType === 'calendarific') {
    const mapping: Record<string, string> = {
      'uk': 'gb'
    };

    return mapping[code2] || code2;
  }

  // ENRICO API usa nombres de países en inglés
  if (apiType === 'enrico') {
    const mapping: Record<string, string> = {
      'es': 'spain',
      'us': 'usa',
      'uk': 'uk',
      'ca': 'canada',
      'fr': 'france',
      'de': 'germany',
      'it': 'italy'
    };

    return mapping[code2] || code2;
  }

  return code2;
}

/**
 * Obtiene feriados/festividades de la API Nager.Date
 * Esta API proporciona días festivos nacionales para muchos países
 *
 * @param countryCode Código ISO del país (2 letras)
 * @param year Año para obtener feriados
 */
async function getNagerHolidays(countryCode: string, year: number): Promise<Holiday[]> {
  const country = normalizeCountryCode(countryCode, 'nager');

  try {
    const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/${country}`, {
      next: { revalidate: 86400 * 30 } // Revalidar cada 30 días
    });

    if (!response.ok) {
      throw new Error(`Error fetching holidays: ${response.status}`);
    }

    const data = await response.json();

    return data.map((holiday: any) => ({
      date: new Date(holiday.date),
      name: holiday.localName || holiday.name,
      type: holiday.types?.join(', ') || 'Public',
      location: holiday.counties || null
    }));
  } catch (error) {
    console.error(`Error fetching Nager holidays for ${countryCode} (${year}):`, error);
    return [];
  }
}

/**
 * Obtiene feriados/festividades de la API Calendarific
 * Esta API requiere una clave API pero tiene mejor cobertura regional
 *
 * @param countryCode Código ISO del país (2 letras)
 * @param year Año para obtener feriados
 * @param region Código de región opcional
 */
async function getCalendarificHolidays(countryCode: string, year: number, region?: string): Promise<Holiday[]> {
  // En una implementación real, deberías obtener la clave API de variables de entorno
  // Para este ejemplo, no usamos clave para evitar problemas, lo que limitará los resultados
  const API_KEY = process.env.CALENDARIFIC_API_KEY || '';
  const country = normalizeCountryCode(countryCode, 'calendarific');

  if (!API_KEY) {
    console.warn('Calendarific API key not configured. Using limited functionality.');
  }

  try {
    // Construir URL con parámetros
    const url = new URL('https://calendarific.com/api/v2/holidays');
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('country', country);
    url.searchParams.append('year', year.toString());

    if (region) {
      url.searchParams.append('location', region);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 86400 * 30 } // Revalidar cada 30 días
    });

    if (!response.ok) {
      throw new Error(`Error fetching holidays: ${response.status}`);
    }

    const data = await response.json();

    if (!data.response || !data.response.holidays) {
      return [];
    }

    return data.response.holidays.map((holiday: any) => ({
      date: new Date(holiday.date.iso),
      name: holiday.name,
      type: holiday.type.join(', '),
      location: holiday.states === 'All' ? null : holiday.states
    }));
  } catch (error) {
    console.error(`Error fetching Calendarific holidays for ${countryCode} (${year}):`, error);
    return [];
  }
}


/**
 * Función principal cacheada para obtener festividades
 * Combina varias fuentes para proporcionar la mejor cobertura
 */
export const getHolidays = cache(async (country: string, region: string, year: number) => {
  // Simulamos un pequeño retraso para mostrar el comportamiento real
  await new Promise(resolve => setTimeout(resolve, 300));

  let holidayList: Holiday[] = [];

  try {
    // 1. Obtener festividades nacionales desde la API principal
    const nationalHolidays = await getNagerHolidays(country, year);
    holidayList = [...nationalHolidays];


    // 3. Intento alternativo con Calendarific si no hay resultados
    if (holidayList.length === 0) {
      console.log('Falling back to Calendarific API...');
      const calendarificHolidays = await getCalendarificHolidays(country, year, region);
      holidayList = [...calendarificHolidays];
    }

    // 5. Añadir feriados de enero del año siguiente (original)
    const nextYear = year + 1;

    // Intentar obtener festividades del siguiente año desde la API
    let nextYearJanuaryHolidays: Holiday[] = [];

    try {
      const nextYearHolidays = await getNagerHolidays(country, nextYear);
      nextYearJanuaryHolidays = nextYearHolidays.filter(
        holiday => holiday.date.getMonth() === 0  // Enero
      );
    } catch (error) {
      console.error('Error fetching next year holidays:', error);
      // Fallback: Usar festividades actuales de enero y actualizar el año
      const januaryHolidays = holidayList.filter(
        holiday => holiday.date.getMonth() === 0
      );

      nextYearJanuaryHolidays = januaryHolidays.map(holiday => ({
        date: new Date(nextYear, 0, holiday.date.getDate()),
        name: holiday.name,
        type: holiday.type,
        location: holiday.location
      }));
    }

    // Añadir etiqueta de "siguiente año" a los feriados de enero
    nextYearJanuaryHolidays.forEach(holiday => {
      holiday.name = `${holiday.name} (siguiente año)`;
      holidayList.push(holiday);
    });

  } catch (error) {
    console.error('Error retrieving holidays:', error);
  }
  //transformer
  const finalList = holidayList
    .filter(item => {
      // Incluir elementos donde:
      return (
        (Array.isArray(item.location) &&
          item.location.some(loc => loc.includes(`-${region.toUpperCase()}`))) ||

        item.location === null
      );
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  console.log('finalList', finalList);

  return finalList;
});