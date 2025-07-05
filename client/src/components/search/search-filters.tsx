import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityAutocomplete } from "@/components/ui/activity-autocomplete";
import { useQuery } from "@tanstack/react-query";
import { SKILL_LEVELS } from "@/lib/constants";
import { Search, MapPin, Filter } from "lucide-react";

interface SearchFiltersProps {
  filters: {
    userType: string;
    city: string;
    societyArea: string;
    activityName: string;
    skillLevel: string;
    workplace: string;
    minAge: string;
    maxAge: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onSearch: () => void;
  userType: "player" | "coach";
  isLoading: boolean;
}

export default function SearchFilters({
  filters,
  onFilterChange,
  onSearch,
  userType,
  isLoading
}: SearchFiltersProps) {
  
  // Fetch data-driven filter options based on user type
  const { data: filterOptions, isLoading: isLoadingOptions, error: optionsError } = useQuery<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }>({
    queryKey: ['/api/users/filter-options', userType],
    queryFn: async () => {
      const response = await fetch(`/api/users/filter-options?userType=${userType}`);
      if (!response.ok) throw new Error('Failed to fetch filter options');
      return response.json();
    },
    enabled: true
  });

  // Debug logging for frontend
  console.log('🔍 FRONTEND DEBUG - filterOptions:', filterOptions);
  console.log('🔍 FRONTEND DEBUG - isLoadingOptions:', isLoadingOptions);
  console.log('🔍 FRONTEND DEBUG - optionsError:', optionsError);

  const cities = filterOptions?.cities || [];
  const societyAreas = filterOptions?.societyAreas || [];
  const activities = filterOptions?.activities || [];
  const skillLevels = filterOptions?.skillLevels || [];
  const workplaces = filterOptions?.workplaces || [];

  console.log('🔍 FRONTEND DEBUG - cities array:', cities);
  console.log('🔍 FRONTEND DEBUG - activities array:', activities);
  console.log('🔍 FRONTEND DEBUG - skillLevels array:', skillLevels);
  console.log('🔍 FRONTEND DEBUG - societyAreas array:', societyAreas);
  console.log('🔍 FRONTEND DEBUG - workplaces array:', workplaces);

  // Loading state check
  if (isLoadingOptions) {
    console.log('🔍 FRONTEND DEBUG - SHOWING LOADING STATE');
    return (
      <Card className="bg-gray-50 border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Loading Filters...</h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state check  
  if (optionsError) {
    console.log('🔍 FRONTEND DEBUG - SHOWING ERROR STATE');
    return (
      <Card className="bg-gray-50 border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Filter className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Error Loading Filters</h3>
          </div>
          <p className="text-red-600">{optionsError.message}</p>
        </CardContent>
      </Card>
    );
  }

  console.log('🔍 FRONTEND DEBUG - SHOWING FILTERS COMPONENT');

  const handleClearFilters = () => {
    onFilterChange("city", "all");
    onFilterChange("societyArea", "all");
    onFilterChange("activityName", "all");
    onFilterChange("skillLevel", "all");
    onFilterChange("workplace", "all");
    onFilterChange("minAge", "");
    onFilterChange("maxAge", "");
  };

  return (
    <div style={{ border: '3px solid red', padding: '20px', margin: '20px', backgroundColor: 'yellow' }}>
      <h2 style={{ color: 'red', fontSize: '24px' }}>DEBUG: SEARCH FILTERS COMPONENT IS RENDERING!</h2>
      <p style={{ color: 'blue', fontSize: '18px' }}>Cities: {cities.length} | Activities: {activities.length} | Skills: {skillLevels.length}</p>
      
      <Card className="bg-gray-50 border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Search Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* 1. Cities */}
            <div className="space-y-2">
              <Label>City</Label>
              <Select
                value={filters.city}
                onValueChange={(value) => onFilterChange("city", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city: string) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Sports */}
            <div className="space-y-2">
              <Label>Sport/Activity</Label>
              <Select
                value={filters.activityName}
                onValueChange={(value) => onFilterChange("activityName", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {activities.map((activity: string) => (
                    <SelectItem key={activity} value={activity}>
                      {activity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Level */}
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={filters.skillLevel}
                onValueChange={(value) => onFilterChange("skillLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {skillLevels.map((level: string) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Society/Area */}
            <div className="space-y-2">
              <Label>Society/Area</Label>
              <Select
                value={filters.societyArea}
                onValueChange={(value) => onFilterChange("societyArea", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {societyAreas.map((area: string) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 5. Company/Workplace */}
            <div className="space-y-2">
              <Label>Company/Workplace</Label>
              <Select
                value={filters.workplace}
                onValueChange={(value) => onFilterChange("workplace", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Workplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workplaces</SelectItem>
                  {workplaces.map((workplace: string) => (
                    <SelectItem key={workplace} value={workplace}>
                      {workplace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="px-6"
            >
              Clear Filters
            </Button>
            <Button
              onClick={onSearch}
              disabled={isLoading}
              className="px-8"
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Active filters display */}
          {(filters.city !== "all" || filters.activityName !== "all" || filters.skillLevel !== "all" || 
            filters.societyArea !== "all" || filters.workplace !== "all" || filters.minAge || filters.maxAge) && (
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.city !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    City: {filters.city}
                  </span>
                )}
                {filters.activityName !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Activity: {filters.activityName}
                  </span>
                )}
                {filters.skillLevel !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Level: {filters.skillLevel}
                  </span>
                )}
                {filters.societyArea !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Area: {filters.societyArea}
                  </span>
                )}
                {filters.workplace !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Workplace: {filters.workplace}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}