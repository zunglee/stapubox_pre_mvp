import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPORTS_ACTIVITIES, TOP_ACTIVITIES } from "@/lib/constants";

interface ActivityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ActivityAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search or enter activity...",
  className 
}: ActivityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredActivities, setFilteredActivities] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter activities based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = SPORTS_ACTIVITIES.filter(activity =>
        activity.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 8); // Show top 8 matches
      setFilteredActivities(filtered);
    } else {
      // Show top 10 popular activities when no input
      setFilteredActivities(TOP_ACTIVITIES);
    }
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If input doesn't match any activity and user clicks away, keep the custom value
        if (inputValue && !SPORTS_ACTIVITIES.includes(inputValue)) {
          onChange(inputValue);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    
    // If user is typing and it's not in the list, allow custom entry
    if (newValue && !SPORTS_ACTIVITIES.some(activity => 
      activity.toLowerCase() === newValue.toLowerCase()
    )) {
      onChange(newValue);
    }
  };

  const handleActivitySelect = (activity: string) => {
    setInputValue(activity);
    onChange(activity);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue) {
        onChange(inputValue);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <ChevronDown 
          className={cn(
            "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform cursor-pointer",
            isOpen && "rotate-180"
          )}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredActivities.length > 0 ? (
            <div className="p-1">
              {filteredActivities.map((activity, index) => (
                <div
                  key={index}
                  onClick={() => handleActivitySelect(activity)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                    value === activity && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check 
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === activity ? "opacity-100" : "opacity-0"
                    )} 
                  />
                  {activity}
                </div>
              ))}
              
              {/* Show "Add custom" option if input doesn't match any activity */}
              {inputValue && 
               !SPORTS_ACTIVITIES.some(activity => 
                 activity.toLowerCase() === inputValue.toLowerCase()
               ) && (
                <div
                  onClick={() => handleActivitySelect(inputValue)}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors border-t border-border mt-1 pt-2"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span className="text-muted-foreground">Add:</span>
                  <span className="ml-1 font-medium">{inputValue}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No activities found. Type to add custom activity.
            </div>
          )}
        </div>
      )}
    </div>
  );
}