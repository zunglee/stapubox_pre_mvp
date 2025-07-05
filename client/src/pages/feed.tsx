import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Share2, Calendar, Trophy, Users, Clock, Search, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShareModal } from "@/components/ui/share-modal";
import { storePendingLike, getPendingLike, clearPendingLike, buildReturnUrl, parseReturnUrl, enablePendingLikeProcessing } from "@/lib/pendingActions";

// Sports configuration with IDs from the specification
const ALL_SPORTS = [
  {id: 7011808, name: 'archery', icon: '🏹'},
  {id: 7020104, name: 'badminton', icon: '🏸'},
  {id: 7020111, name: 'basketball', icon: '🏀'},
  {id: 7021524, name: 'boxing', icon: '🥊'},
  {id: 7030805, name: 'chess', icon: '♟️'},
  {id: 7030918, name: 'cricket', icon: '🏏'},
  {id: 7032525, name: 'cycling', icon: '🚴'},
  {id: 7040913, name: 'discus throw', icon: '🥏'},
  {id: 7060514, name: 'fencing', icon: '🤺'},
  {id: 7061515, name: 'football', icon: '⚽'},
  {id: 7071215, name: 'golf', icon: '⛳'},
  {id: 7071325, name: 'gymnastics', icon: '🤸'},
  {id: 7080113, name: 'hammer throw', icon: '🔨'},
  {id: 7080917, name: 'high jump', icon: '🏃'},
  {id: 7080315, name: 'hockey', icon: '🏑'},
  {id: 7100122, name: 'javelin throw', icon: '🗿'},
  {id: 7102115, name: 'judo', icon: '🥋'},
  {id: 7110102, name: 'kabaddi', icon: '🤼'},
  {id: 7110815, name: 'kho-kho', icon: '🏃'},
  {id: 7121514, name: 'long jump', icon: '🏃'},
  {id: 7122115, name: 'ludo', icon: '🎯'},
  {id: 7130118, name: 'marathon', icon: '🏃'},
  {id: 7131801, name: 'martial arts - karate', icon: '🥋'},
  {id: 7160913, name: 'pickleball', icon: '🏓'},
  {id: 7161215, name: 'polo', icon: '🐎'},
  {id: 7181321, name: 'running', icon: '🏃'},
  {id: 7190112, name: 'sailing', icon: '⛵'},
  {id: 7190815, name: 'shooting', icon: '🎯'},
  {id: 7191508, name: 'shot put', icon: '🥎'},
  {id: 7191111, name: 'skating', icon: '⛸️'},
  {id: 7191711, name: 'squash', icon: '🎾'},
  {id: 7192118, name: 'surfing', icon: '🏄'},
  {id: 7192313, name: 'swimming', icon: '🏊'},
  {id: 7200122, name: 'table tennis', icon: '🏓'},
  {id: 7200511, name: 'taekwondo', icon: '🥋'},
  {id: 7200514, name: 'tennis', icon: '🎾'},
  {id: 7200815, name: 'throwball', icon: '🏐'},
  {id: 7201816, name: 'triple jump', icon: '🏃'},
  {id: 7221512, name: 'volleyball', icon: '🏐'},
  {id: 7230519, name: 'weightlifting', icon: '🏋️'},
  {id: 7231805, name: 'wrestling', icon: '🤼'}
];

interface BuzzDigest {
  id: number; // Database primary key
  sid: number;
  buzzId: number;
  sname: string;
  title: string;
  summary: string;
  srcName: string;
  srcLink: string;
  imgSrc: string;
  faviconSrc: string;
  publishTime: string;
  likeCnt: number | null;
  dislikeCnt: number | null;
  shareCnt: number | null;
  viewCnt: number | null;
  liked: boolean;
  viewed: boolean;
}

export default function Feed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Configuration: Show/hide like button on articles
  const SHOW_LIKE_BUTTON = false;
  
  // URL parsing for buzz_id and acc_src parameters
  const urlParams = new URLSearchParams(window.location.search);
  const highlightBuzzId = urlParams.get('buzz_id') ? parseInt(urlParams.get('buzz_id')!) : null;
  const accSrc = urlParams.get('acc_src'); // Encrypted user ID for tracking

  const dropdownRef = useRef<HTMLDivElement>(null);
  // Load selected sports from localStorage or use defaults
  const loadSelectedSportsFromStorage = (): number[] => {
    try {
      const stored = localStorage.getItem('stapubuzz_selected_sports');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading selected sports from localStorage:', error);
    }
    return [];
  };

  const [selectedSports, setSelectedSports] = useState<number[]>(loadSelectedSportsFromStorage());
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [spectatorCode, setSpectatorCode] = useState<string>('');
  const [shareModalData, setShareModalData] = useState({
    isOpen: false,
    title: '',
    url: '',
    buzzId: 0
  });

  // Generate or retrieve spectator code for all users (fallback for auth issues)
  useEffect(() => {
    let code = localStorage.getItem('stapubuzz_spectator_code');
    if (!code) {
      code = generateSpectatorCode();
      localStorage.setItem('stapubuzz_spectator_code', code);
    }
    setSpectatorCode(code);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateSpectatorCode = () => {
    return 'spec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);



  // Fetch news data from internal API with like status
  const { data: newsData = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['/api/news', selectedSports, page, highlightBuzzId], // Include all parameters in cache key
    queryFn: async () => {
      let url = `/api/news?page=${page}&limit=10`;
      
      // Add buzz_id for individual article focus
      if (highlightBuzzId) {
        url += `&highlight_buzz_id=${highlightBuzzId}`;
      }
      
      // Authentication handled server-side via session cookies
      
      // Don't force anonymous mode for feed - we need user session for likes
      
      // Add acc_src for tracking page visits
      if (accSrc) {
        url += `&acc_src=${encodeURIComponent(accSrc)}`;
      }
      
      // Add sports filter
      if (selectedSports && selectedSports.length > 0) {
        url += `&sports=${selectedSports.join(',')}`;
        console.log(`🏅 Frontend sending sports filter: ${selectedSports.join(',')}`);
      }
      
      const response = await fetch(url, {
        credentials: 'include' // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.news || [];
    },
    enabled: Boolean(hasMoreData || page === 1) // Always enabled for news fetching
  });

  // Update allNews when new data arrives
  useEffect(() => {
    if (newsData && newsData.length > 0) {

      
      if (page === 1) {
        // First page or filter change - replace all data with fresh data

        setAllNews([...newsData]); // Force new array reference
      } else {
        // Subsequent pages - append data
        setAllNews(prev => [...prev, ...newsData]);
      }
      
      // Check if we have more data (less than 10 items means last page)
      if (newsData.length < 10) {
        setHasMoreData(false);
      }
      setLoadingMore(false);
    } else if (page > 1) {
      // No data on subsequent pages means we've reached the end
      setHasMoreData(false);
      setLoadingMore(false);
    }
  }, [newsData, page]);

  // Reset pagination when sports filter changes
  useEffect(() => {
    setPage(1);
    setAllNews([]);
    setHasMoreData(true);
    setLoadingMore(false);
  }, [selectedSports]);

  // Check for pending like action when user logs in (moved after likeMutation definition)

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMoreData || isFetching) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      
      // Load more when user is 200px from bottom or reached last 5 items
      const remainingItems = allNews.length;
      const visibleItems = Math.ceil(window.innerHeight / 400); // Approximate items per screen
      const nearLastFive = remainingItems - visibleItems <= 5;
      
      if (scrollPosition >= documentHeight - 200 || nearLastFive) {
        setLoadingMore(true);
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [allNews.length, loadingMore, hasMoreData, isFetching]);

  // Handle like/unlike
  const likeMutation = useMutation({
    mutationFn: async ({ newsId, liked }: { newsId: number; liked: boolean }) => {
      const response = await fetch(`/api/news/${newsId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update like');
      }
      
      return response.json();
    },
    onMutate: async ({ newsId, liked }) => {
      // Cancel any outgoing refetches to avoid optimistic update conflicts
      await queryClient.cancelQueries({ queryKey: ['/api/news'] });

      // Apply optimistic update immediately
      setAllNews(prevNews => {
        const updatedNews = prevNews.map(item => 
          item.id === newsId
            ? { 
                ...item, 
                liked: liked,
                likeCnt: Math.max(0, (item.likeCnt || 0) + (liked ? 1 : -1))
              }
            : item
        );
        
        console.log(`🔥 Optimistic update: newsId=${newsId}, liked=${liked}`);
        return updatedNews;
      });

      // Return context for rollback
      return { newsId, liked };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context) {
        setAllNews(prevNews => 
          prevNews.map(item => 
            item.id === context.newsId
              ? { 
                  ...item, 
                  liked: !context.liked,
                  likeCnt: Math.max(0, (item.likeCnt || 0) + (context.liked ? -1 : 1))
                }
              : item
          )
        );
      }
      
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      console.log(`🔥 Like API success: newsId=${variables.newsId}, liked=${data.liked}, likeCnt=${data.likeCnt}`);
      
      // Update the state with server response to ensure consistency
      setAllNews(prevNews => {
        const updatedNews = prevNews.map(item => 
          item.id === variables.newsId
            ? { 
                ...item, 
                liked: data.liked,
                likeCnt: data.likeCnt !== undefined ? data.likeCnt : item.likeCnt
              }
            : item
        );
        
        console.log(`🔥 State updated with server response`);
        return updatedNews;
      });
      
      // Don't invalidate cache to prevent conflicts with our state updates
    }
  });

  // Handle share
  const shareMutation = useMutation({
    mutationFn: async (buzzId: number) => {
      const response = await fetch(`/api/news/${buzzId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for session authentication
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record share');
      }
      
      return response.json();
    },
    onError: (error) => {
      // Show error toast for share failure
      toast({
        title: "Error",
        description: "Failed to record share. Please try again.",
        variant: "destructive",
      });
    }
  });

  const [_, setLocation] = useLocation();

  // Check for pending like action when user logs in
  useEffect(() => {
    if (user && user.id) {
      const pendingLike = getPendingLike();
      if (pendingLike && pendingLike.shouldProcess) {
        // Process the pending like - find the article by buzzId and use its database ID
        const article = allNews.find(item => item.buzzId === pendingLike.buzzId);
        if (article) {
          likeMutation.mutate({ 
            newsId: article.id, // Use database ID as the identifier
            liked: !article.liked  // Toggle current state
          });
        }
        
        // Clear the pending action
        clearPendingLike();
        
        // Restore sports filter from pending action
        if (pendingLike.selectedSports.length > 0) {
          setSelectedSports(pendingLike.selectedSports);
        }
        
        // Parse and apply the return URL parameters without navigation
        // (User is already on the feed page due to the redirect fix)
        if (pendingLike.returnUrl) {
          try {
            const url = new URL(pendingLike.returnUrl);
            const sportsParam = url.searchParams.get('sports');
            if (sportsParam) {
              const sports = sportsParam.split(',').map(Number).filter(n => !isNaN(n));
              if (sports.length > 0) {
                setSelectedSports(sports);
              }
            }
          } catch (error) {
            console.log('Could not parse return URL:', error);
          }
        }
      }
    }
  }, [user]);

  const handleLike = (newsId: number, currentlyLiked: boolean, articleTitle: string) => {
    // If user is logged in, process like immediately
    if (user) {
      likeMutation.mutate({ newsId: newsId, liked: !currentlyLiked });
      return;
    }

    // If user is logged out, store pending like and redirect to login
    const returnUrl = buildReturnUrl(window.location.href, selectedSports);
    
    // Find the article by newsId to get its buzzId for pending like storage
    const article = allNews.find(item => item.id === newsId);
    if (article) {
      storePendingLike({
        buzzId: article.buzzId,
        title: articleTitle,
        returnUrl,
        selectedSports
      });
    }

    // Redirect to login page
    setLocation('/login');
  };

  const encryptUserId = (userId: number | string): string => {
    // Simple base64 encoding for user ID tracking
    return btoa(`user_${userId}_${Date.now()}`);
  };

  const handleShare = async (buzzId: number, title: string, srcLink?: string) => {
    // Create shareable URL with buzz_id and acc_src (encrypted user ID)
    let shareableUrl = `${window.location.origin}/feed?buzz_id=${buzzId}`;
    
    // Add encrypted user ID for tracking if user is logged in
    if (user && user.id) {
      const encryptedUserId = encryptUserId(user.id);
      shareableUrl += `&acc_src=${encryptedUserId}`;
    }
    
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: "StapuBuzz",
          text: `Check out this article on StapuBuzz: ${title}`,
          url: shareableUrl
        });
        
        // Record the share interaction
        shareMutation.mutate(buzzId);
      } catch (error) {
        // User cancelled the share - don't show error
        console.log('Share cancelled by user');
      }
    } else {
      // Fallback: show modal for unsupported browsers
      setShareModalData({
        isOpen: true,
        title: title,
        url: shareableUrl,
        buzzId: buzzId
      });
    }
  };

  const handleCloseShareModal = () => {
    setShareModalData({
      isOpen: false,
      title: '',
      url: '',
      buzzId: 0
    });
  };

  const handleSportSelect = (sportId: number) => {
    if (!selectedSports.includes(sportId)) {
      if (selectedSports.length >= 5) {
        toast({
          title: "Maximum Limit Reached",
          description: "You can select up to 5 sports only. Please remove some sports to add new ones.",
          variant: "destructive",
        });
        return;
      }
      const newSelectedSports = [...selectedSports, sportId];
      setSelectedSports(newSelectedSports);
      
      // Save to localStorage
      try {
        localStorage.setItem('stapubuzz_selected_sports', JSON.stringify(newSelectedSports));
      } catch (error) {
        console.error('Error saving selected sports to localStorage:', error);
      }
    }
    // Don't close dropdown after selection to allow multiple selections
  };

  const handleSportRemove = (sportId: number) => {
    const newSelectedSports = selectedSports.filter(id => id !== sportId);
    setSelectedSports(newSelectedSports);
    
    // Save to localStorage
    try {
      localStorage.setItem('stapubuzz_selected_sports', JSON.stringify(newSelectedSports));
    } catch (error) {
      console.error('Error saving selected sports to localStorage:', error);
    }
  };

  const filteredSports = ALL_SPORTS.filter(sport =>
    sport.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selectedSports.includes(sport.id)
  );

  const getSportIcon = (sid: number) => {
    const sport = ALL_SPORTS.find(s => s.id === sid);
    return sport?.icon || '🏆';
  };

  const getSportName = (sid: number) => {
    const sport = ALL_SPORTS.find(s => s.id === sid);
    return sport?.name || 'Sports';
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-[#E17827] mr-2" />
            <h1 className="text-4xl font-bold text-gray-900">StapuBuzz</h1>
          </div>
          <p className="text-xl text-gray-600">Your Ultimate Sports News Destination</p>
          <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>Live Updates</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>24/7 Coverage</span>
            </div>
            <div className="flex items-center">
              <Trophy className="w-4 h-4 mr-1" />
              <span>All Sports</span>
            </div>
          </div>
        </div>

        {/* Sports Filter Section */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* Selected Sports Chips - Left side, showing max 5 */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {selectedSports.slice(0, 5).map((sportId) => {
                const sport = ALL_SPORTS.find(s => s.id === sportId);
                return (
                  <Badge key={sportId} variant="secondary" className="flex items-center space-x-1 px-3 py-1">
                    <span className="text-sm">{sport?.icon}</span>
                    <span>{toTitleCase(sport?.name || '')}</span>
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-600" 
                      onClick={() => handleSportRemove(sportId)}
                    />
                  </Badge>
                );
              })}
              {selectedSports.length === 0 && (
                <span className="text-gray-500 text-sm">Select up to 5 sports to filter news</span>
              )}
            </div>

            {/* Sports Dropdown - Right side */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2"
                disabled={isLoading && newsData.length > 0}
              >
                <Trophy className="w-4 h-4" />
                <span>Add Sports ({selectedSports.length}/5)</span>
                {isLoading && newsData.length > 0 ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search sports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredSports.length === 0 && searchTerm && (
                        <div className="p-2 text-gray-500 text-center">
                          No sports found matching "{searchTerm}"
                        </div>
                      )}
                      {filteredSports.length === 0 && !searchTerm && selectedSports.length >= 5 && (
                        <div className="p-2 text-gray-500 text-center">
                          Maximum 5 sports selected. Remove a sport to add more.
                        </div>
                      )}
                      {filteredSports.map((sport) => (
                        <div
                          key={sport.id}
                          className="flex items-center p-3 hover:bg-blue-50 cursor-pointer rounded-md transition-colors duration-150 -mx-1 mx-1"
                          onClick={() => handleSportSelect(sport.id)}
                        >
                          <span className="text-lg mr-3">{sport.icon}</span>
                          <span className="capitalize font-medium">{sport.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* News Feed */}
        <div className="space-y-6">
          {/* Always show news cards - either real data or loading skeletons */}
          {allNews.length === 0 && isLoading ? (
            // First-time loading: minimal skeleton cards
            [...Array(3)].map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-100 rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-3/4 mt-3 animate-pulse"></div>
                </CardHeader>
                <div className="px-6 pb-4">
                  <div className="w-full h-40 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            allNews.map((item: BuzzDigest) => (
            <Card 
              key={item.buzzId} 
              className={`overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-md ${
                highlightBuzzId === item.buzzId ? 'bg-blue-50 border-2 border-blue-200' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <span className="mr-1">{getSportIcon(item.sid)}</span>
                    {toTitleCase(item.sname)}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {item.publishTime && !isNaN(new Date(item.publishTime).getTime()) 
                      ? format(new Date(item.publishTime), "MMM dd, yyyy • h:mm a")
                      : format(new Date(), "MMM dd, yyyy • h:mm a")
                    }
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                  {item.title}
                </CardTitle>
              </CardHeader>
              
              {item.imgSrc && (
                <div className="px-6 pb-4">
                  <img 
                    src={item.imgSrc} 
                    alt={item.title}
                    className="w-full h-64 object-cover rounded-lg shadow-sm"
                  />
                </div>
              )}
              
              <CardContent>
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed text-base">
                    {item.summary}
                  </p>
                  
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-[#E17827] hover:text-[#E17827]/90 mt-2"
                    onClick={() => window.open(item.srcLink, '_blank')}
                  >
                    Read full article →
                  </Button>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    {SHOW_LIKE_BUTTON && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(item.id, item.liked, item.title)}
                        disabled={likeMutation.isPending}
                        className={`flex items-center space-x-2 hover:bg-orange-50 transition-colors ${
                          item.liked ? 'text-orange-600' : 'text-gray-600'
                        }`}
                      >
                        <Flame className={`w-5 h-5 ${item.liked ? 'fill-current' : ''}`} />
                        <span className="font-medium">
                          {item.likeCnt || 0}
                        </span>
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleShare(item.buzzId, item.title, item.srcLink)}
                      disabled={shareMutation.isPending}
                      className="flex items-center space-x-2 text-gray-600 hover:bg-green-50"
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="font-medium">Share</span>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-500 font-medium">
                    {item.srcName}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}

          {/* Loading more content indicator */}
          {loadingMore && allNews.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-3 text-gray-600">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Loading more news...</span>
              </div>
            </div>
          )}

          {/* End of content indicator */}
          {!hasMoreData && allNews.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">You've reached the end of the feed</div>
            </div>
          )}
        </div>

        {/* Empty state for no news */}
        {allNews.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No sports news available</h3>
                <p>Try selecting different sports or check back later for updates!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Message */}
        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-[#E17827] mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Stay Connected with StapuBuzz</h3>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get the latest updates on sports from around the world. Real-time news, live coverage, and authentic sports journalism.
          </p>
        </div>
      </div>

      {/* Share Modal for fallback */}
      <ShareModal
        isOpen={shareModalData.isOpen}
        onClose={handleCloseShareModal}
        title={shareModalData.title}
        url={shareModalData.url}
        onShare={() => shareMutation.mutate(shareModalData.buzzId)}
      />
    </div>
  );
}