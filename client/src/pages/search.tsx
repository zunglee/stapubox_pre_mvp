import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/constants";
import SearchFilters from "@/components/search/search-filters";
import ProfileCard from "@/components/profile/profile-card";
import { Users, Presentation, Search as SearchIcon } from "lucide-react";

interface SearchFiltersData {
  userType: string;
  city: string;
  societyArea: string;
  activityName: string;
  skillLevel: string;
  workplace: string;
  minAge: string;
  maxAge: string;
}

export default function Search() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  // Load activeUserType from localStorage or use default
  const loadActiveUserTypeFromStorage = (): "player" | "coach" => {
    try {
      const stored = localStorage.getItem('stapubox_search_user_type');
      if (stored && (stored === "player" || stored === "coach")) {
        return stored as "player" | "coach";
      }
    } catch (error) {
      console.error('Error loading user type from localStorage:', error);
    }
    return "player";
  };

  const [activeUserType, setActiveUserType] = useState<"player" | "coach">(loadActiveUserTypeFromStorage());
  // Load filters from localStorage or use defaults
  const loadFiltersFromStorage = (): SearchFiltersData => {
    try {
      const stored = localStorage.getItem('stapubox_search_filters');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
    return {
      userType: "player",
      city: "all",
      societyArea: "all",
      activityName: "all",
      skillLevel: "all",
      workplace: "all",
      minAge: "",
      maxAge: ""
    };
  };

  const [filters, setFilters] = useState<SearchFiltersData>(loadFiltersFromStorage());
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Update filters when user type changes
  useEffect(() => {
    setFilters((prev: SearchFiltersData) => ({ ...prev, userType: activeUserType }));
    setOffset(0);
  }, [activeUserType]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") params.append(key, value);
    });
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    return params.toString();
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [API_ENDPOINTS.USERS.SEARCH, buildQueryString(), Date.now()], // Force fresh queries
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINTS.USERS.SEARCH}?${buildQueryString()}&t=${Date.now()}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    staleTime: 0, // Always refetch
    gcTime: 0  // Don't cache results
  });

  const handleSearch = () => {
    setOffset(0);
    refetch();
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Save to localStorage
    try {
      localStorage.setItem('stapubox_search_filters', JSON.stringify(newFilters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  };

  const users = data?.users || [];
  const hasMore = data?.hasMore || false;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">Failed to load search results</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Discover Sports Partners Near You
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Search our community of sports enthusiasts. Find the perfect match for your <strong>skill level</strong> and from your <strong>locality, society or workplace</strong>.
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white rounded-lg p-1 flex shadow-sm">
            <Button
              variant={activeUserType === "player" ? "default" : "ghost"}
              className={`px-6 py-2 ${activeUserType === "player" ? "player-theme" : ""}`}
              onClick={() => {
                setActiveUserType("player");
                localStorage.setItem('stapubox_search_user_type', "player");
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              Players
            </Button>
            <Button
              variant={activeUserType === "coach" ? "default" : "ghost"}
              className={`px-6 py-2 ${activeUserType === "coach" ? "coach-theme" : ""}`}
              onClick={() => {
                setActiveUserType("coach");
                localStorage.setItem('stapubox_search_user_type', "coach");
              }}
            >
              <Presentation className="w-4 h-4 mr-2" />
              Coaches
            </Button>
          </div>
        </div>

        {/* DEBUG: Search Filters Section */}
        <div style={{ border: '5px solid blue', padding: '10px', margin: '10px', backgroundColor: 'lightblue' }}>
          <h1 style={{ color: 'red', fontSize: '32px' }}>DEBUG: ABOUT TO RENDER SEARCH FILTERS</h1>
          <p style={{ color: 'blue', fontSize: '20px' }}>activeUserType: {activeUserType}</p>
          <p style={{ color: 'green', fontSize: '20px' }}>isLoading: {isLoading.toString()}</p>
        </div>
        
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          userType={activeUserType}
          isLoading={isLoading}
        />

        {/* Results */}
        <div className="mt-8">
          {isLoading && offset === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user: any) => (
                  <ProfileCard 
                    key={user.id} 
                    user={user} 
                    onInterestSent={() => refetch()}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <Button 
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    variant="outline"
                    className="px-8"
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We are still in the early stages of building the world's first sports network 
                and will soon have many more users. Until then, relax your filters may be 🙂
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
