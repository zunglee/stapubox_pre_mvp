import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

// Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  types?: string[];
  componentRestrictions?: { country: string };
  disabled?: boolean;
  className?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location...",
  types = ["(cities)"],
  componentRestrictions = { country: "in" },
  disabled = false,
  className = ""
}: PlacesAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [service, setService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load Google Maps API if not already loaded
    if (!window.google || !window.google.maps) {
      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDgvWsa_ZEAtV2WIJfz9h845RUrwgfoXpA&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Set global callback
        (window as any).initGoogleMaps = () => {
          initializeServices();
        };
        
        document.head.appendChild(script);
      }
    } else {
      initializeServices();
    }
  }, []);

  const initializeServices = () => {
    if (window.google) {
      setService(new window.google.maps.places.AutocompleteService());
      
      // Create a dummy div for PlacesService
      const div = document.createElement('div');
      const map = new window.google.maps.Map(div);
      setPlacesService(new window.google.maps.places.PlacesService(map));
    }
  };

  const searchPlaces = (query: string) => {
    if (!service || !query.trim()) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    
    const request = {
      input: query,
      types,
      componentRestrictions
    };

    service.getPlacePredictions(request, (results: any, status: any) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    });
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
    }, 300);
  };

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    onChange(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    // Get place details if needed
    if (placesService) {
      const request = {
        placeId: prediction.place_id,
        fields: ['geometry', 'name', 'formatted_address', 'address_components']
      };

      placesService.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          onChange(prediction.description, place);
        }
      });
    }
  };

  const handleInputBlur = () => {
    // Delay hiding predictions to allow clicking on them
    setTimeout(() => setShowPredictions(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => value && predictions.length > 0 && setShowPredictions(true)}
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

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              onClick={() => handlePlaceSelect(prediction)}
            >
              <div className="font-medium text-gray-900">
                {prediction.structured_formatting.main_text}
              </div>
              <div className="text-sm text-gray-500">
                {prediction.structured_formatting.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}