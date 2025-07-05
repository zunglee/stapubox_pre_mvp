import { useState, useEffect } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  formatted_address: string;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
  hasPermission: boolean;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<LocationData | null> => {
    try {
      // Use a simpler geocoding approach with fetch to Google Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA`
      );
      
      if (!response.ok) {
        console.error('Geocoding API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('Geocoding response:', data);
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        let city = '';
        let country = '';
        
        // Extract city with proper priority logic to avoid administrative divisions
        if (result.address_components) {
          let locality = '';
          let adminArea2 = '';
          let adminArea3 = '';
          let sublocality = '';
          
          for (const component of result.address_components) {
            const types = component.types || [];
            const name = component.long_name;
            
            // Skip names that contain "Division" or other administrative terms
            if (name.includes('Division') || name.includes('Zone') || name.includes('Circle')) {
              continue;
            }
            
            if (types.includes('locality') && types.includes('political')) {
              locality = name;
            } else if (types.includes('administrative_area_level_2') && types.includes('political')) {
              adminArea2 = name;
            } else if (types.includes('administrative_area_level_3') && types.includes('political')) {
              adminArea3 = name;
            } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
              sublocality = name;
            } else if (types.includes('country')) {
              country = name;
            }
          }
          
          // Priority: locality (like "Noida", "Gurgaon") > admin_area_3 > admin_area_2 > sublocality
          // This ensures we get actual city names, not administrative divisions
          city = locality || adminArea3 || adminArea2 || sublocality || 'Location Detected';
          
          console.log('Location detection results:', {
            locality,
            adminArea2,
            adminArea3,
            sublocality,
            selectedCity: city
          });
        }
        
        return {
          latitude: lat,
          longitude: lng,
          city: city || 'Detected Location',
          country: country || 'India',
          formatted_address: result.formatted_address || `${lat}, ${lng}`
        };
      } else {
        console.error('Geocoding failed:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const locationData = await reverseGeocode(latitude, longitude);
          if (locationData) {
            setLocation(locationData);
            setHasPermission(true);
          } else {
            setError('Unable to determine your city. Please enter manually.');
          }
        } catch (err) {
          setError('Failed to get location details.');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        setHasPermission(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please enter your city manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Check for existing permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setHasPermission(result.state === 'granted');
      });
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    requestLocation,
    hasPermission
  };
}