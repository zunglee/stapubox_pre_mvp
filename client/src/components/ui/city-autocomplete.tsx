import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CitySuggestion {
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  display: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Enter your city",
  disabled = false,
  className = ""
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchCities = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Use Google Geocoding API for city search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:IN&types=locality|administrative_area_level_2&key=AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'OK' && data.results) {
          const cities: CitySuggestion[] = data.results.slice(0, 5).map((result: any) => {
            let city = '';
            let state = '';
            let country = '';
            
            // Extract location components with proper priority to avoid divisions
            let locality = '';
            let adminArea2 = '';
            let adminArea3 = '';
            
            result.address_components?.forEach((component: any) => {
              const types = component.types || [];
              const name = component.long_name;
              
              // Skip administrative divisions
              if (name.includes('Division') || name.includes('Zone') || name.includes('Circle')) {
                return;
              }
              
              if (types.includes('locality') && types.includes('political')) {
                locality = name;
              } else if (types.includes('administrative_area_level_2') && types.includes('political')) {
                adminArea2 = name;
              } else if (types.includes('administrative_area_level_3') && types.includes('political')) {
                adminArea3 = name;
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
              } else if (types.includes('country')) {
                country = name;
              }
            });
            
            // Priority: locality > admin_area_3 > admin_area_2
            city = locality || adminArea3 || adminArea2 || result.formatted_address.split(',')[0];
            
            return {
              name: city || result.formatted_address.split(',')[0],
              state: state || '',
              country: country || 'India',
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              display: `${city || result.formatted_address.split(',')[0]}${state ? ', ' + state : ''}`
            };
          });
          
          setSuggestions(cities);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('City search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      searchCities(query);
    }, 500);
  };

  const handleCitySelect = (city: CitySuggestion) => {
    onChange(city.display, `${city.lat},${city.lng}`);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              onClick={() => handleCitySelect(city)}
            >
              <div className="font-medium text-gray-900">
                {city.name}
              </div>
              {city.state && (
                <div className="text-sm text-gray-500">
                  {city.state}, {city.country}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}