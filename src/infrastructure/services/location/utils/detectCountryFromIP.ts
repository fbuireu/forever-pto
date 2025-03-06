export async function detectCountryFromIP(){
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        cache: 'no-store',
      });

      if (!ipResponse.ok) {
        throw new Error('Client IP couldn\'t be obtained');
      }

      const { ip } = await ipResponse.json();

      const geoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!geoResponse.ok) {
        throw new Error('Geographic data couldn\'t be obtained');
      }

      const geoData = await geoResponse.json();
      return geoData.country?.toLowerCase() || '';
    } catch (error) {
      console.error('Error while getting the country from the IP:', error);
      return '';
    }

}