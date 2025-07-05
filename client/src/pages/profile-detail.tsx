import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SkillLevelIndicator } from "@/components/ui/skill-level-indicator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, SKILL_LEVELS } from "@/lib/constants";
import { 
  Heart, 
  Clock, 
  MapPin, 
  Building, 
  Award, 
  ArrowLeft, 
  Phone, 
  Calendar,
  Trophy,
  User,
  Check,
  X,
  Mail
} from "lucide-react";
import { getPrimaryActivityIcons } from "@/lib/sportIcons";

export default function ProfileDetail() {
  const params = useParams<{ id: string }>();
  const userId = params?.id ? parseInt(params.id) : null;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get URL search parameters to determine where user came from
  const urlParams = new URLSearchParams(window.location.search);
  const fromBucket = urlParams.get('from'); // 'sent', 'received', 'accepted', 'declined'

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: profileData, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId
  });

  // Get current user's interest relationships to determine appropriate CTAs
  const { data: sentInterestsData } = useQuery({
    queryKey: [API_ENDPOINTS.INTERESTS.SENT],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated
  });

  const { data: receivedInterestsData } = useQuery({
    queryKey: [API_ENDPOINTS.INTERESTS.RECEIVED],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated
  });

  // State to track if actions have been completed
  const [actionCompleted, setActionCompleted] = useState(false);

  // Determine interest relationship status with this user
  const getInterestRelationship = () => {
    if (!isAuthenticated || !userId || !sentInterestsData || !receivedInterestsData) return null;
    
    const sentInterests = (sentInterestsData as any).interests || [];
    const receivedInterests = (receivedInterestsData as any).interests || [];
    
    // Check if user sent interest to current profile (ignore withdrawn - treat as reset)
    const sentInterest = sentInterests.find((interest: any) => 
      interest.receiverId === userId && interest.status !== 'withdrawn'
    );
    if (sentInterest) {
      return { type: 'sent', interest: sentInterest };
    }
    
    // Check if user received interest from current profile (ignore withdrawn - treat as reset)
    const receivedInterest = receivedInterests.find((interest: any) => 
      interest.senderId === userId && interest.status !== 'withdrawn'
    );
    if (receivedInterest) {
      return { type: 'received', interest: receivedInterest };
    }
    
    return null;
  };

  const interestRelationship = getInterestRelationship();

  const sendInterestMutation = useMutation({
    mutationFn: async () => {
      console.log("Sending interest to user:", userId);
      const response = await apiRequest("POST", API_ENDPOINTS.INTERESTS.SEND, {
        receiverId: userId
      });
      return response;
    },
    onSuccess: async () => {
      toast({
        title: "Interest Sent",
        description: `Your interest has been sent to ${(profileData as any)?.user?.name}!`
      });
      
      // Set action completed to trigger UI update
      setActionCompleted(true);
      
      // Invalidate all relevant caches to update the UI immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/interests/sent"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
      ]);
      
      // Force refetch of interest data to update relationship status
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.refetchQueries({ queryKey: ["/api/interests/sent"] })
      ]);
    },
    onError: (error: any) => {
      console.error("Send interest error:", error);
      toast({
        title: "Failed to Send Interest",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const acceptInterestMutation = useMutation({
    mutationFn: async (interestId: number) => {
      return apiRequest("PUT", API_ENDPOINTS.INTERESTS.ACCEPT(interestId));
    },
    onSuccess: async () => {
      setActionCompleted(true);
      toast({
        title: "Interest Accepted",
        description: "Contact details have been shared with both parties! Check your interests accepted bucket."
      });
      
      // Invalidate all relevant caches for real-time updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/interests/sent"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
      ]);
      
      // Force refetch of interest data to update relationship status
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.refetchQueries({ queryKey: ["/api/interests/sent"] })
      ]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Accept",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const declineInterestMutation = useMutation({
    mutationFn: async (interestId: number) => {
      return apiRequest("PUT", API_ENDPOINTS.INTERESTS.DECLINE(interestId));
    },
    onSuccess: async () => {
      setActionCompleted(true);
      toast({
        title: "Interest Declined",
        description: "The interest has been declined."
      });
      
      // Invalidate all relevant caches for real-time updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/interests/sent"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
      ]);
      
      // Force refetch of interest data to update relationship status
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.refetchQueries({ queryKey: ["/api/interests/sent"] })
      ]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Decline",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const withdrawInterestMutation = useMutation({
    mutationFn: async (interestId: number) => {
      return apiRequest("PUT", `/api/interests/${interestId}/withdraw`);
    },
    onSuccess: async () => {
      setActionCompleted(true);
      toast({
        title: "Interest Withdrawn",
        description: "Your interest has been withdrawn."
      });
      
      // Invalidate all relevant caches for real-time updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/interests/sent"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
      ]);
      
      // Force refetch of interest data to update relationship status
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/interests/received"] }),
        queryClient.refetchQueries({ queryKey: ["/api/interests/sent"] })
      ]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Withdraw",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!(profileData as any)?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
        <Button onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  const { user, activities = [] } = (profileData as any) || {};
  const isCoach = user?.userType === 'coach';
  const primaryActivities = activities?.filter((a: any) => a.isPrimary) || [];
  
  // Get primary activity icons for this profile
  const primaryActivityIcons = getPrimaryActivityIcons(activities || []);

  const getSkillLevelLabel = (level: string) => {
    return SKILL_LEVELS.find(s => s.value === level)?.label || level;
  };

  const handleSendInterest = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to send interests to other users.",
        variant: "destructive"
      });
      return;
    }
    sendInterestMutation.mutate();
  };

  // Render dynamic CTAs based on interest relationship status
  const renderDynamicCTA = () => {
    const relationship = interestRelationship;
    
    // If no relationship exists, show normal Send Interest button
    if (!relationship) {
      return (
        <Button
          onClick={handleSendInterest}
          disabled={sendInterestMutation.isPending}
          className={`${
            isCoach ? 'coach-theme' : 'player-theme'
          } px-8`}
        >
          {sendInterestMutation.isPending ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Send Interest
            </>
          )}
        </Button>
      );
    }

    const { type, interest } = relationship;
    const isActionCompleted = actionCompleted;

    // RECEIVED bucket - Show Accept & Decline buttons
    if (type === 'received' && interest.status === 'pending') {
      if (isActionCompleted) {
        return (
          <div className="text-green-600 font-medium">
            Action completed successfully!
          </div>
        );
      }
      
      return (
        <div className="flex space-x-3">
          <Button
            onClick={() => acceptInterestMutation.mutate(interest.id)}
            disabled={acceptInterestMutation.isPending || declineInterestMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            {acceptInterestMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Accept
              </>
            )}
          </Button>
          <Button
            onClick={() => declineInterestMutation.mutate(interest.id)}
            disabled={acceptInterestMutation.isPending || declineInterestMutation.isPending}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 px-6"
          >
            {declineInterestMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Declining...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Decline
              </>
            )}
          </Button>
        </div>
      );
    }

    // SENT bucket - Show Withdraw button
    if (type === 'sent' && interest.status === 'pending') {
      if (isActionCompleted) {
        return (
          <div className="text-green-600 font-medium">
            Action completed successfully!
          </div>
        );
      }
      
      return (
        <Button
          onClick={() => withdrawInterestMutation.mutate(interest.id)}
          disabled={withdrawInterestMutation.isPending}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 px-6"
        >
          {withdrawInterestMutation.isPending ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Withdrawing...
            </>
          ) : (
            <>
              <X className="w-4 h-4 mr-2" />
              Withdraw
            </>
          )}
        </Button>
      );
    }

    // ACCEPTED bucket - Show contact information, no CTAs
    if (interest.status === 'accepted') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2 flex items-center">
            <Check className="w-5 h-5 mr-2" />
            Connected - Contact Information
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-green-700">
              <Phone className="w-4 h-4" />
              <span>{user?.phoneNumber}</span>
            </div>
            {user?.email && (
              <div className="flex items-center space-x-2 text-green-700">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // DECLINED bucket - No CTAs, view-only
    if (interest.status === 'declined') {
      return (
        <div className="text-red-600 font-medium flex items-center">
          <X className="w-5 h-5 mr-2" />
          Interest Declined
        </div>
      );
    }

    // Default fallback
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b relative overflow-hidden">
        {/* Sport Icons Background */}
        {primaryActivityIcons.length > 0 && (
          <div className="absolute top-6 right-6 flex space-x-4 pointer-events-none z-10">
            {primaryActivityIcons.map((activityIcon: any, index: number) => (
              <div
                key={index}
                className="text-gray-400 select-none"
                style={{
                  fontSize: index === 0 ? '3rem' : '2.5rem',
                  fontFamily: 'Arial, sans-serif',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: 0.5
                }}
              >
                {activityIcon.icon}
              </div>
            ))}
          </div>
        )}
        

        
        <div className="max-w-4xl mx-auto px-4 py-4 relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (fromBucket) {
                setLocation("/interests");
              } else {
                setLocation("/");
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {fromBucket ? `Back to Interests` : "Back to Search"}
          </Button>
          
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-200 relative flex-shrink-0">
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {user.name?.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                <Badge 
                  variant="outline" 
                  className={`${
                    isCoach 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-orange-600 text-orange-600'
                  } text-lg px-3 py-1 w-fit`}
                >
                  {user.userType}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{user.city}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Age {user.age}</span>
                </div>
                {user.workplace && (
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{user.workplace}</span>
                  </div>
                )}
              </div>

              {/* Dynamic CTAs based on interest relationship */}
              {isAuthenticated && renderDynamicCTA()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Activities & Skills */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>{isCoach ? 'Coaching Expertise' : 'Primary Activities'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {primaryActivities.map((activity: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{activity.activityName}</h3>
                        <Badge 
                          className={`${
                            isCoach 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          Primary
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <SkillLevelIndicator skillLevel={activity.skillLevel} />
                      </div>
                      {isCoach && activity.coachingExperienceYears && (
                        <p className="text-sm text-gray-600">
                          {activity.coachingExperienceYears} years of coaching experience
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Secondary Activities */}
            {activities.filter((a: any) => !a.isPrimary).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Other Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.filter((a: any) => !a.isPrimary).map((activity: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{activity.activityName}</h4>
                        <SkillLevelIndicator skillLevel={activity.skillLevel} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bio for Coaches */}
            {isCoach && user.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900">{user.city}</p>
                  {user.societyArea && (
                    <p className="text-sm text-gray-600">{user.societyArea}</p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Age</label>
                  <p className="text-gray-900">{user.age} years old</p>
                </div>
                
                {user.workplace && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Workplace</label>
                      <p className="text-gray-900">{user.workplace}</p>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Profile Visibility</label>
                  <p className="text-gray-900 capitalize">{user.profileVisibility}</p>
                </div>
              </CardContent>
            </Card>

            {/* Coaching Experience Summary for Coaches */}
            {isCoach && activities.some((a: any) => a.coachingExperienceYears) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Experience</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.max(...activities
                        .filter((a: any) => a.coachingExperienceYears)
                        .map((a: any) => a.coachingExperienceYears)
                      )}
                    </div>
                    <p className="text-gray-600">Years of Coaching Experience</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}