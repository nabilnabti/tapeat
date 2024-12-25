import { getLocationFromCache, saveLocationToCache } from './locationCache';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export const DEFAULT_LOCATION = {
  lat: 43.2965,  // Marseille coordinates
  lng: 5.3698,
  address: 'Marseille, France'
};

export async function getCurrentLocation(): Promise<Location> {
  try {
    // Vérifier si la géolocalisation est supportée
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return DEFAULT_LOCATION;
    }

    // Essayer d'obtenir la position en cache d'abord
    const cachedLocation = await getLocationFromCache('current');
    if (cachedLocation) {
      return cachedLocation;
    }

    // Définir un timeout plus long (20 secondes)
    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      const { latitude: lat, longitude: lng } = position.coords;

      // Obtenir l'adresse avec Google Maps Geocoding
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng }
      });

      if (!response.results[0]) {
        throw new Error('No address found');
      }

      const location = {
        lat,
        lng,
        address: response.results[0].formatted_address
      };

      // Mettre en cache la position
      await saveLocationToCache('current', location);

      return location;
    } catch (error) {
      console.warn('Error getting precise location:', error);
      console.info('Falling back to default location');
      return DEFAULT_LOCATION;
    }

  } catch (error) {
    console.warn('Geolocation error, using default location:', error);
    return DEFAULT_LOCATION;
  }
}

export async function getLocationFromAddress(address: string): Promise<Location> {
  try {
    const coords = await getCoordsFromAddress(address);
    return {
      ...coords,
      address
    };
  } catch (error) {
    console.error('Error getting location from address:', error);
    return DEFAULT_LOCATION;
  }
}

export async function getCoordsFromAddress(address: string): Promise<{lat: number; lng: number}> {
  try {
    if (!address?.trim()) {
      throw new Error('Adresse requise');
    }

    // Standardize address format
    let formattedAddress = standardizeAddress(address);

    // Try to get from cache first
    const cachedLocation = await getLocationFromCache(formattedAddress);
    if (cachedLocation) {
      return {
        lat: cachedLocation.lat,
        lng: cachedLocation.lng
      };
    }

    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({ 
      address: formattedAddress,
      region: 'FR',
      componentRestrictions: { country: 'FR' }
    });
    
    const result = response.results[0];
    if (!result?.geometry?.location) {
      throw new Error('Adresse introuvable');
    }

    const location = result.geometry.location;
    const coords = {
      lat: location.lat(),
      lng: location.lng()
    };
    
    // Validate coordinates
    if (isNaN(coords.lat) || isNaN(coords.lng) || 
        coords.lat === 0 || coords.lng === 0) {
      throw new Error('Coordonnées invalides');
    }

    // Cache the valid coordinates
    await saveLocationToCache(formattedAddress, {
      ...coords,
      address: result.formatted_address
    });
    
    return coords;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    throw error;
  }
}

// Helper function to standardize address format
export function standardizeAddress(address: string): string {
  let formattedAddress = address.trim();
  
  // Remove any extra spaces
  formattedAddress = formattedAddress.replace(/\s+/g, ' ');
  
  // Check if address already matches the standard format
  if (/^[\w\s]+,\s*\d{5}\s*[\w\s]+,\s*France$/i.test(formattedAddress)) {
    return formattedAddress;
  }
  
  // Extract components from address
  const match = formattedAddress.match(/^(.*?)(?:,\s*)?(\d{5})(?:,\s*)?([\w\s]+)?(?:,\s*France)?$/i);
  if (match) {
    const [_, street, postalCode, city = 'Marseille'] = match;
    return `${street}, ${postalCode} ${city}, France`;
  }
  
  // If no match, just append France if needed
  if (!formattedAddress.toLowerCase().includes('france')) {
    formattedAddress += ', France';
  }
  
  return formattedAddress;
}