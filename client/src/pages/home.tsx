import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectWithBadges } from "@/components/ui/multi-select";
import { Users, Presentation, MapPin, Trophy, Heart, ArrowRight, Newspaper } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SKILL_LEVELS, API_ENDPOINTS } from "@/lib/constants";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import ProfileCard from "@/components/profile/profile-card";
import InterestsOverview from "@/components/interests/interests-overview";

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  // Search filters state - show all users for anonymous users, players by default for authenticated users
  const [searchFilters, setSearchFilters] = useState({
    userType: "player", // Default to players for all users
    cities: [] as string[],
    activities: [] as string[],
    skillLevels: [] as string[],
    societyAreas: [] as string[],
    workplaces: [] as string[]
  });

  // Fetch data-driven filter options based on selected user type
  const { data: filterOptions, isLoading: filterOptionsLoading, error: filterOptionsError } = useQuery<{
    cities: string[];
    societyAreas: string[];
    activities: string[];
    skillLevels: string[];
    workplaces: string[];
  }>({
    queryKey: ['/api/users/filter-options', searchFilters.userType, isAuthenticated ? 'auth' : 'anon'],
    queryFn: async () => {
      const response = await fetch(`/api/users/filter-options?userType=${searchFilters.userType}`, {
        credentials: isAuthenticated ? 'include' : 'omit',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch filter options');
      return response.json();
    },
    staleTime: isAuthenticated ? 60 * 1000 : 0, // No cache for anonymous users
    refetchOnWindowFocus: false,
    retry: 2
  });

  const cities = filterOptions?.cities || [];
  const activities = filterOptions?.activities || [];
  const skillLevels = filterOptions?.skillLevels || [];
  const societyAreas = filterOptions?.societyAreas || [];
  const workplaces = filterOptions?.workplaces || [];





  const handlePlayerSignup = () => {
    navigate("/register?type=player");
  };

  const handleCoachSignup = () => {
    navigate("/register?type=coach");
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/search");
    } else {
      navigate("/register");
    }
  };

  // Fetch current user's profile data with activities (for logged-in users)
  const { data: currentUserProfile } = useQuery<{
    user: any;
    activities: any[];
  }>({
    queryKey: [API_ENDPOINTS.USERS.PROFILE],
    enabled: isAuthenticated
  });

  // Build query string for multi-select filters
  const buildMultiSelectQuery = () => {
    const params = new URLSearchParams();
    
    // Always include userType filter
    if (searchFilters.userType && searchFilters.userType !== "all") {
      params.append("userType", searchFilters.userType);
    }
    
    // Multi-select arrays - only add if values are selected
    if (searchFilters.cities.length > 0) {
      searchFilters.cities.forEach(city => params.append("city", city));
    }
    if (searchFilters.activities.length > 0) {
      searchFilters.activities.forEach(activity => params.append("activityName", activity));
    }
    if (searchFilters.skillLevels.length > 0) {
      searchFilters.skillLevels.forEach(level => params.append("skillLevel", level));
    }
    if (searchFilters.societyAreas.length > 0) {
      searchFilters.societyAreas.forEach(area => params.append("societyArea", area));
    }
    if (searchFilters.workplaces.length > 0) {
      searchFilters.workplaces.forEach(workplace => params.append("workplace", workplace));
    }
    
    return params.toString();
  };

  // Fetch real users with search filters (authentication-aware)
  const { data: searchData, refetch: refetchUsers } = useQuery<{
    users: any[];
    total: number;
    hasMore: boolean;
  }>({
    queryKey: [API_ENDPOINTS.USERS.SEARCH, buildMultiSelectQuery(), isAuthenticated ? user?.id : 'anonymous'],
    queryFn: async () => {
      const queryString = buildMultiSelectQuery();
      let url = queryString ? `${API_ENDPOINTS.USERS.SEARCH}?${queryString}&t=${Date.now()}` : `${API_ENDPOINTS.USERS.SEARCH}?t=${Date.now()}`;
      
      // Add forceAnonymous parameter for unauthenticated users to bypass session detection
      if (!isAuthenticated) {
        url += "&forceAnonymous=true";
      }
      
      const response = await fetch(url, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    gcTime: 1000 * 60 * 5  // Keep in memory for 5 minutes
  });

  const realUsers = searchData?.users || [];

  // Use only real users from database
  const allProfiles = realUsers;

  // Filter profiles by user type first, then other criteria
  const userTypeProfiles = searchFilters.userType === "all" 
    ? allProfiles 
    : allProfiles.filter((profile: any) => profile.userType === searchFilters.userType);
  
  const filteredProfiles = userTypeProfiles.filter((profile: any) => {
    const matchesCity = searchFilters.cities.length === 0 || 
      searchFilters.cities.some(city => profile.city.toLowerCase().includes(city.toLowerCase()));
    
    const matchesActivity = searchFilters.activities.length === 0 || 
      profile.activities?.some((activity: any) => 
        searchFilters.activities.some(filterActivity => 
          activity.activityName.toLowerCase().includes(filterActivity.toLowerCase())
        )
      );
    
    const matchesSkillLevel = searchFilters.skillLevels.length === 0 || 
      profile.activities?.some((activity: any) => 
        searchFilters.skillLevels.includes(activity.skillLevel)
      );
    
    const matchesSocietyArea = searchFilters.societyAreas.length === 0 || 
      searchFilters.societyAreas.some(area => 
        profile.societyArea?.toLowerCase().includes(area.toLowerCase())
      );
    
    const matchesWorkplace = searchFilters.workplaces.length === 0 || 
      searchFilters.workplaces.some(workplace => 
        profile.workplace?.toLowerCase().includes(workplace.toLowerCase())
      );
    
    return matchesCity && matchesActivity && matchesSkillLevel && matchesSocietyArea && matchesWorkplace;
  });

  const clearFilters = () => {
    setSearchFilters({
      userType: "player",
      cities: [],
      activities: [],
      skillLevels: [],
      societyAreas: [],
      workplaces: []
    });
  };





  return (
    <div className="min-h-screen bg-white">
      {/* Interests Overview for logged-in users */}
      {isAuthenticated && (
        <div className="bg-gradient-to-r from-orange-50 to-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <InterestsOverview />
          </div>
        </div>
      )}



      {/* Hero Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <section className="relative bg-gradient-to-br from-blue-50 to-orange-50 py-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iIzAwQjBGMCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                Claim Your Spot in the{" "}
                <span className="bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent">
                  World's First Sports Network
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
                Register now for exclusive early access.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  onClick={handlePlayerSignup}
                  size="lg" 
                  className="player-theme text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join as Player
                </Button>
                <Button 
                  onClick={() => navigate('/register?type=coach')}
                  size="lg" 
                  className="coach-theme text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
                >
                  <Presentation className="w-5 h-5 mr-2" />
                  Join as Coach
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* StapuBuzz Section - Only for logged-out users */}
      {!isAuthenticated && (
        <section className="py-8 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-2xl p-6 md:p-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Stay Updated with{" "}
                <span className="bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent">
                  StapuBuzz
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Get the latest sports news, match updates, and exclusive content from the world of sports. Your one-stop destination for everything sports.
              </p>
              <Button 
                onClick={() => navigate("/feed")}
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-blue-500 text-white px-8 py-4 text-lg font-semibold rounded-lg hover:from-orange-600 hover:to-blue-600 transition-all duration-300"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Explore StapuBuzz
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Searchable Database Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* User's Own Profile Card - Only for logged-in users */}
          {isAuthenticated && currentUserProfile?.user && (
            <div className="mb-12 bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Profile</h2>
              <div className="max-w-md">
                <ProfileCard 
                  user={{
                    ...currentUserProfile.user,
                    activities: currentUserProfile.activities || []
                  }} 
                  isOwnProfile={true} 
                  onInterestSent={() => {}} 
                />
              </div>
            </div>
          )}
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Discover Players & Coaches
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Search our community of sports enthusiasts. Find the perfect match for your <span className="font-bold">skill level</span> and from your <span className="font-bold">locality, society or workplace</span>.
            </p>
          </div>

          {/* Search Filters */}
          <Card className="mb-8 p-6 bg-white shadow-sm">
            {/* User Type Filter Buttons */}
            <div className="mb-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setSearchFilters({...searchFilters, userType: "player"})}
                  className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 ${
                    searchFilters.userType === "player"
                      ? "player-theme text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Players
                </Button>
                <Button
                  onClick={() => setSearchFilters({...searchFilters, userType: "coach"})}
                  className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 ${
                    searchFilters.userType === "coach" 
                      ? "coach-theme text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Presentation className="w-5 h-5 mr-2" />
                  Coaches
                </Button>
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* 1. Cities */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cities</label>
                <MultiSelectWithBadges
                  options={cities}
                  value={searchFilters.cities}
                  onValueChange={(value) => setSearchFilters({...searchFilters, cities: value})}
                  placeholder="Select cities..."
                />
              </div>

              {/* 2. Sports */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sports</label>
                <MultiSelectWithBadges
                  options={activities}
                  value={searchFilters.activities}
                  onValueChange={(value) => setSearchFilters({...searchFilters, activities: value})}
                  placeholder="Select sports..."
                />
              </div>

              {/* 3. Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <MultiSelectWithBadges
                  options={skillLevels}
                  value={searchFilters.skillLevels}
                  onValueChange={(value) => setSearchFilters({...searchFilters, skillLevels: value})}
                  placeholder="Select levels..."
                />
              </div>

              {/* 4. Society/Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Society/Area</label>
                <MultiSelectWithBadges
                  options={societyAreas}
                  value={searchFilters.societyAreas}
                  onValueChange={(value) => setSearchFilters({...searchFilters, societyAreas: value})}
                  placeholder="Select areas..."
                />
              </div>

              {/* 5. Company/Workplace */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Company/Workplace</label>
                <MultiSelectWithBadges
                  options={workplaces}
                  value={searchFilters.workplaces}
                  onValueChange={(value) => setSearchFilters({...searchFilters, workplaces: value})}
                  placeholder="Select workplaces..."
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {filteredProfiles.length} of {userTypeProfiles.length} profiles
              </div>
              <Button 
                onClick={clearFilters}
                variant="outline" 
                className="px-4 py-2 border-gray-300"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map((profile: any) => (
              <ProfileCard 
                key={profile.id} 
                user={profile} 
                onInterestSent={async () => {
                  // Invalidate all relevant caches for real-time updates
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["/api/users/search"] }),
                    queryClient.invalidateQueries({ queryKey: ["/api/interests/sent"] }),
                    queryClient.invalidateQueries({ queryKey: ["/api/interests/received"] })
                  ]);
                  refetchUsers();
                }}
              />
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                {allProfiles.length === 0 && !isAuthenticated
                  ? "Be the first to join StapuBox! Create your profile and start connecting with sports enthusiasts."
                  : allProfiles.length === 0 && isAuthenticated
                  ? "No other users found yet. Invite friends to join StapuBox!"
                  : "No profiles found matching your criteria"
                }
              </div>
              {allProfiles.length > 0 && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
              {allProfiles.length === 0 && !isAuthenticated && (
                <Button onClick={handleGetStarted} className="player-theme text-white">
                  Create Your Profile
                </Button>
              )}
            </div>
          )}
        </div>
      </section>



      {/* CTA Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-orange-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Sports Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of players and coaches who are already connecting and playing together.
            </p>
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}