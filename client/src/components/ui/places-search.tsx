import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface PlacesSearchProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  types?: string[];
  disabled?: boolean;
  className?: string;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function PlacesSearch({
  value,
  onChange,
  placeholder = "Search for a place...",
  types = ["establishment"],
  disabled = false,
  className = ""
}: PlacesSearchProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Use server-side Google Places API for better security and CORS handling
      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(query)}&location=28.5355,77.3910&radius=50000`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'OK' && data.results) {
          const places: PlaceSuggestion[] = data.results.slice(0, 5).map((result: any) => ({
            description: result.formatted_address || result.name,
            place_id: result.place_id,
            structured_formatting: {
              main_text: result.name,
              secondary_text: result.formatted_address
            }
          }));
          
          setSuggestions(places);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Places search error:', error);
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
      searchPlaces(query);
    }, 500);
  };

  const handlePlaceSelect = async (place: PlaceSuggestion) => {
    onChange(place.structured_formatting.main_text);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get detailed place information
    try {
      const response = await fetch(
        `/api/places/details?place_id=${place.place_id}&fields=name,formatted_address,geometry`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.result) {
          onChange(place.structured_formatting.main_text, data.result);
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
    }
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
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              type="button"
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              onClick={() => handlePlaceSelect(place)}
            >
              <div className="font-medium text-gray-900">
                {place.structured_formatting.main_text}
              </div>
              <div className="text-sm text-gray-500">
                {place.structured_formatting.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}