import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, SKILL_LEVELS } from "@/lib/constants";
import { Handshake, Clock, MapPin, Building, Award, Edit, Home } from "lucide-react";
import { SkillLevelIndicator } from "@/components/ui/skill-level-indicator";
import { useLocation } from "wouter";
import { getPrimaryActivityIcons } from "@/lib/sportIcons";

interface ProfileCardProps {
  user: any;
  onInterestSent?: () => void;
  isOwnProfile?: boolean;
}

export default function ProfileCard({ user, onInterestSent, isOwnProfile = false }: ProfileCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [interestStatus, setInterestStatus] = useState<string | null>(null);

  // Get primary activity icons for background
  const primaryActivityIcons = getPrimaryActivityIcons(user.activities || []);

  const sendInterestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", API_ENDPOINTS.INTERESTS.SEND, {
        receiverId: user.id
      });
      return { ...response, receiverName: user.name };
    },
    onSuccess: async (data) => {
      setInterestStatus("pending");
      toast({
        title: "Interest Sent",
        description: `Your interest has been sent to ${data.receiverName}!`
      });
      
      // Invalidate all relevant caches for real-time updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/users/search"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/interests/sent"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/interests/received"] })
      ]);
      
      onInterestSent?.();
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

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking button
    
    if (!isAuthenticated) {
      // Store target user info for pending interest
      localStorage.setItem("pendingInterest", JSON.stringify({
        receiverId: user.id,
        receiverName: user.name
      }));
      // Redirect to registration/login
      setLocation("/register");
      return;
    }
    
    // Send interest immediately if authenticated
    sendInterestMutation.mutate();
  };

  const handleCardClick = () => {
    if (isOwnProfile) {
      setLocation("/profile"); // Navigate to edit profile page
    } else {
      setLocation(`/profile/${user.id}`); // Navigate to view profile page
    }
  };

  const getButtonContent = () => {
    if (sendInterestMutation.isPending) {
      return (
        <>
          <Clock className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      );
    }
    
    if (interestStatus === "pending") {
      return (
        <>
          <Clock className="w-4 h-4 mr-2" />
          Interest Sent
        </>
      );
    }
    
    return (
      <>
        <Handshake className="w-4 h-4 mr-2" />
        Send Interest
      </>
    );
  };

  const isCoach = user.userType === "coach";
  const displayActivities = user.activities || [];

  return (
    <Card className="w-full cursor-pointer hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
      <CardContent className="p-6" onClick={handleCardClick}>
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-200 relative flex-shrink-0">
            {user.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-400">
                {user.name?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold truncate">{user.name}</h3>
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  isCoach 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}
              >
                {isCoach ? "Coach" : "Player"}
              </Badge>
            </div>

            {/* Location Information */}
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{user.city}</span>
              </div>
              
              {user.societyArea && (
                <div className="flex items-center space-x-1">
                  <Home className="w-4 h-4" />
                  <span>{user.societyArea}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workplace/Organization */}
        {user.workplace && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building className="w-4 h-4" />
              <span>{user.workplace}</span>
            </div>
          </div>
        )}

        {/* Activities Section */}
        {displayActivities.length > 0 && (
          <div className="mb-4 relative">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {isCoach ? "Coaching Activities" : "Activities"}
            </h4>
            <div className="space-y-3">
              {displayActivities.slice(0, 3).map((activity: any, index: number) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{activity.activityName}</span>
                    {/* Show sport icon on the right for primary activities */}
                    {activity.isPrimary && primaryActivityIcons.length > 0 && (
                      <span
                        className="text-gray-400 select-none"
                        style={{
                          fontSize: '2.4rem', // 2x larger than before
                          fontFamily: 'Arial, sans-serif',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          opacity: 0.5
                        }}
                      >
                        {primaryActivityIcons.find((icon: any) => 
                          icon.activityName.toLowerCase() === activity.activityName.toLowerCase()
                        )?.icon}
                      </span>
                    )}
                  </div>
                  <SkillLevelIndicator skillLevel={activity.skillLevel} />
                </div>
              ))}
              {displayActivities.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{displayActivities.length - 3} more activities
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coaching Experience for Coaches */}
        <div className="mb-4">
          {isCoach && user.activities?.some((a: any) => a.coachingExperienceYears) && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Award className="w-4 h-4" />
              <span>
                {Math.max(...user.activities
                  .filter((a: any) => a.coachingExperienceYears)
                  .map((a: any) => a.coachingExperienceYears || 0)
                )} years experience
              </span>
            </div>
          )}
        </div>

        {/* Bio Preview for Coaches */}
        {isCoach && user.bio && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio}
            </p>
          </div>
        )}

        {/* Action Button - Hide for own profile */}
        {!isOwnProfile && (
          <Button
            onClick={handleButtonClick}
            disabled={interestStatus === "pending" || sendInterestMutation.isPending}
            className={`w-full ${
              isCoach 
                ? 'coach-theme' 
                : 'player-theme'
            } ${
              interestStatus === "pending" 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
          >
            {getButtonContent()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}