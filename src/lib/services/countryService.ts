import { cache } from 'react';

// Función para obtener países - cacheada a nivel de aplicación
// usando React Server Components Cache
export const getCountries = cache(async () => {
  try {
    // Usar URL absoluta para entorno de desarrollo y producción
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/countries`, {
      next: {
        revalidate: 86400 // revalidar datos cada 24h
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener países: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en servicio de países:', error);
  }
});

// Función para obtener regiones de un país - cacheada a nivel de aplicación
export const getRegions = cache(async (country: string) => {
  try {
    if (!country) return [];

    // Usar URL absoluta para entorno de desarrollo y producción
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/regions?country=${country}`, {
      next: {
        revalidate: 86400 // revalidar datos cada 24h
      }
    });


    if (!response.ok) {
      throw new Error(`Error al obtener regiones: ${response.status}`);
    }

    const { data } = await response.json();
    //transformer
    return data?.states.map((state) => {
      return { label: state.name, value: state.state_code.toLowerCase() };
    });
  } catch (error) {
    console.error(`Error en servicio de regiones para país ${country}:`, error);
  }
});

// Alternativa a ipapi.co - función para detectar país por IP
export const detectCountryFromIP = cache(async () => {
  try {
    // Método 1: Usar ipify + ipinfo (combinación más estable)
    // Primero obtenemos la IP
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-store'  // Evitar caché para IPs actualizadas
    });

    if (!ipResponse.ok) {
      throw new Error('No se pudo obtener la IP del cliente');
    }

    const { ip } = await ipResponse.json();

    // Luego consultamos los datos geográficos de esa IP
    const geoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!geoResponse.ok) {
      throw new Error('No se pudieron obtener datos geográficos');
    }

    const geoData = await geoResponse.json();
    return geoData.country?.toLowerCase() || 'es';

  } catch (error) {
    // Método 2 (fallback): Si el primer enfoque falla, intentar con otro servicio
    try {
      const response = await fetch('https://geolocation-db.com/json/', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('No se pudo detectar el país con el servicio alternativo');
      }

      const data = await response.json();
      return data.country_code?.toLowerCase() || 'es';

    } catch (fallbackError) {
      console.error('Error al detectar país (ambos métodos):', error, fallbackError);
    }
  }
});

// Función que integra detección de país y región para inicializar los valores
export const detectUserLocation = cache(async () => {
  try {
    // Detectar país
    const countryCode = await detectCountryFromIP();

    // Si es España u otro país con regiones, obtener la región por geolocalización
    let regionCode = '';

    if (countryCode === 'es') {

      try {
        // Intentar obtener región más específica
        const geoResponse = await fetch('https://ipinfo.io/json', {
          cache: 'no-store'
        });

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();

          // Mapeo de regiones según el formato de ipinfo
          // Esto es un mapeo simplificado, podría ser más detallado
          const regionMapping: Record<string, string> = {
            'Catalonia': 'ca',
            'Madrid': 'md',
            'Andalusia': 'an',
            'Extremadura': 'ex'
            // Añadir más mapeos según necesidad
          };

          // Intentar mapear la región o usar un valor predeterminado
          regionCode = regionMapping[geoData.region] || 'ca';
        }
      } catch (regionError) {
        console.error('Error al detectar región:', regionError);
      }
    }

    return {
      country: countryCode,
      region: regionCode
    };
  } catch (error) {
    console.error('Error al detectar ubicación del usuario:', error);
    return {
      country: 'es',
      region: 'ca'
    };
  }
});