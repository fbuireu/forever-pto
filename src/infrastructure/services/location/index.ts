import type { NextRequest } from 'next/server';
import { cache } from 'react';

export const detectCountryFromIP = cache(async () => {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-store',
    });

    if (!ipResponse.ok) {
      throw new Error('No se pudo obtener la IP del cliente');
    }

    const { ip } = await ipResponse.json();

    const geoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!geoResponse.ok) {
      throw new Error('No se pudieron obtener datos geográficos');
    }

    const geoData = await geoResponse.json();
    return geoData.country?.toLowerCase() || '';
  } catch (error) {
    console.error('Error en detectCountryFromIP:', error);
    return '';
  }
});

async function detectCountryFromCDN(): Promise<string> {
  try {
    const response = await fetch('https://stretchmytimeoff.com/cdn-cgi/trace', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Error al obtener información del CDN');
    }

    const text = await response.text();

    const lines = text.split('\n');
    const locLine = lines.find((line) => line.startsWith('loc='));

    if (locLine) {
      const countryCode = locLine.substring(4).trim();
      return countryCode.toLowerCase();
    }

    return '';
  } catch (error) {
    console.error('Error detectando país desde CDN:', error);
    return '';
  }
}

export async function detectCountryFromRequest(request: NextRequest): Promise<string> {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip');

    if (clientIP) {
      const geoResponse = await fetch(`https://ipinfo.io/${clientIP}/json`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData.country) {
          console.log('País detectado usando IP directa:', geoData.country);
          return geoData.country.toLowerCase();
        }
      }
    }
  } catch (error) {
    console.error('Error detectando país con IP directa:', error);
  }

  try {
    const country = await detectCountryFromIP();
    if (country) {
      console.log('País detectado usando detectCountryFromIP:', country);
      return country;
    }
  } catch (error) {
    console.error('Error detectando país con detectCountryFromIP:', error);
  }

  try {
    const country = await detectCountryFromCDN();
    if (country) {
      console.log('País detectado usando CDN-CGI:', country);
      return country;
    }
  } catch (error) {
    console.error('Error detectando país con CDN-CGI:', error);
  }

  console.warn('No se pudo detectar el país con ningún método');
  return '';
}
