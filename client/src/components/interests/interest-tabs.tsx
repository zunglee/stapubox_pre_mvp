import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, SKILL_LEVELS } from "@/lib/constants";
import { Check, X, Heart, Clock, CheckCircle, XCircle, Phone, Mail, MapPin, Home, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { SkillLevelIndicator } from "@/components/ui/skill-level-indicator";
import { getPrimaryActivityIcons } from "@/lib/sportIcons";

interface InterestTabsProps {
  receivedInterests: any[];
  sentInterests: any[];
  acceptedInterests: any[];
  declinedInterests: any[];
  onInterestUpdate: () => void;
  initialTab?: string | null;
}

export default function InterestTabs({
  receivedInterests,
  sentInterests,
  acceptedInterests,
  declinedInterests,
  onInterestUpdate,
  initialTab
}: InterestTabsProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(initialTab || "received");

  // Update active tab when initialTab changes (for deeplink navigation)
  useEffect(() => {
    if (initialTab && ['received', 'sent', 'accepted', 'declined'].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const acceptInterestMutation = useMutation({
    mutationFn: async (interestId: number) => {
      return apiRequest("PUT", API_ENDPOINTS.INTERESTS.ACCEPT(interestId));
    },
    onSuccess: async () => {
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
      
      onInterestUpdate();
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
      
      onInterestUpdate();
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
      
      onInterestUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Withdraw",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const getSkillLevelLabel = (level: string) => {
    return SKILL_LEVELS.find(s => s.value === level)?.label || level;
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "Recently";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  const handleCardClick = (userId: number, bucketType: string) => {
    setLocation(`/profile/${userId}?from=${bucketType}`);
  };

  const renderInterestItem = (interest: any, type: "received" | "sent" | "accepted" | "declined") => {
    const otherUser = interest.sender || interest.receiver;
    const isCoach = otherUser?.userType === 'coach';
    const primaryActivity = otherUser?.activities?.find((a: any) => a.isPrimary);
    
    // Get primary activity icons for this user
    const primaryActivities = otherUser?.activities?.filter((a: any) => a.isPrimary) || [];
    const primaryActivityIcons = getPrimaryActivityIcons(primaryActivities);
    
    return (
      <Card key={interest.id} className="w-full cursor-pointer hover:shadow-md transition-shadow duration-200 h-full relative overflow-hidden">
        {/* Sport Icons in top white space */}
        {primaryActivityIcons.length > 0 && (
          <div className="absolute top-4 right-4 flex space-x-3 pointer-events-none z-20">
            {primaryActivityIcons.map((activityIcon: any, index: number) => (
              <div
                key={index}
                className="text-gray-400 select-none"
                style={{
                  fontSize: index === 0 ? '2rem' : '1.5rem',
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
        
        <CardContent className="p-4 h-full flex flex-col relative z-10">
          {/* Interest Status Badge */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
              <span className="text-xs text-gray-500">{formatTimeAgo(interest.createdAt)}</span>
              {type === "received" && <Badge className="bg-blue-100 text-blue-600 text-xs">New Interest</Badge>}
              {type === "sent" && <Badge className="bg-orange-100 text-orange-600 text-xs">Sent</Badge>}
              {type === "accepted" && <Badge className="bg-green-100 text-green-600 text-xs">Connected</Badge>}
              {type === "declined" && <Badge className="bg-red-100 text-red-600 text-xs">Declined</Badge>}
            </div>
          </div>

          {/* Clickable Profile Section */}
          <div onClick={() => handleCardClick(otherUser.id, type)} className="cursor-pointer">
            {/* Header with Avatar and Basic Info */}
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-200 relative flex-shrink-0">
                {otherUser?.profilePhotoUrl ? (
                  <img
                    src={otherUser?.profilePhotoUrl}
                    alt={otherUser?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-400">
                    {otherUser?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold truncate">{otherUser?.name}</h3>
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

                {/* Location Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{otherUser?.city}</span>
                  </div>
                  {otherUser?.societyArea && (
                    <div className="flex items-center space-x-1">
                      <Home className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{otherUser?.societyArea}</span>
                    </div>
                  )}
                  {otherUser?.workplace && (
                    <div className="flex items-center space-x-1">
                      <Building className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{otherUser?.workplace}</span>
                    </div>
                  )}
                </div>

                {/* Primary Activity */}
                {primaryActivity && (
                  <div className="mb-3">
                    <div className="mb-1">
                      <span className="text-sm font-medium text-gray-900">{primaryActivity.activityName}</span>
                    </div>
                    <SkillLevelIndicator skillLevel={primaryActivity.skillLevel} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details for Accepted Interests */}
          {type === "accepted" && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-700">
                  <Phone className="w-4 h-4" />
                  <span>{otherUser?.phoneNumber}</span>
                </div>
                {otherUser?.email && (
                  <div className="flex items-center space-x-2 text-green-700">
                    <Mail className="w-4 h-4" />
                    <span>{otherUser?.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-auto pt-4">
            {type === "received" && (
              <>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    acceptInterestMutation.mutate(interest.id);
                  }}
                  disabled={acceptInterestMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    declineInterestMutation.mutate(interest.id);
                  }}
                  disabled={declineInterestMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Decline
                </Button>
              </>
            )}

            {type === "sent" && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  withdrawInterestMutation.mutate(interest.id);
                }}
                disabled={withdrawInterestMutation.isPending}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Withdraw
              </Button>
            )}

            {type === "accepted" && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Connected</span>
              </div>
            )}

            {type === "declined" && (
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Declined</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: string, icon: React.ReactNode, message: string) => (
    <div className="text-center py-12">
      {icon}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No {type} interests</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );

  return (
    <Card className="bg-white shadow-md overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200">
          <TabsList className="w-full h-auto p-0 bg-transparent rounded-none">
            <TabsTrigger 
              value="received" 
              className="flex-1 py-3 px-2 sm:py-4 sm:px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 text-center">
                <span className="text-xs sm:text-sm font-medium">Received</span>
                <Badge className="bg-blue-600 text-white text-xs mt-1 sm:mt-0 min-w-[20px] h-5 flex items-center justify-center">
                  {receivedInterests.length}
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="sent"
              className="flex-1 py-3 px-2 sm:py-4 sm:px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 text-center">
                <span className="text-xs sm:text-sm font-medium">Sent</span>
                <Badge className="bg-gray-200 text-gray-600 text-xs mt-1 sm:mt-0 min-w-[20px] h-5 flex items-center justify-center">
                  {sentInterests.length}
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="accepted"
              className="flex-1 py-3 px-2 sm:py-4 sm:px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 text-center">
                <span className="text-xs sm:text-sm font-medium">Accepted</span>
                <Badge className="bg-green-100 text-green-600 text-xs mt-1 sm:mt-0 min-w-[20px] h-5 flex items-center justify-center">
                  {acceptedInterests.length}
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="declined"
              className="flex-1 py-3 px-2 sm:py-4 sm:px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 text-center">
                <span className="text-xs sm:text-sm font-medium">Declined</span>
                <Badge className="bg-red-100 text-red-600 text-xs mt-1 sm:mt-0 min-w-[20px] h-5 flex items-center justify-center">
                  {declinedInterests.length}
                </Badge>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-6">
          <TabsContent value="received" className="mt-0">
            {receivedInterests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {receivedInterests.map((interest) => renderInterestItem(interest, "received"))}
              </div>
            ) : (
              renderEmptyState(
                "received",
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />,
                "No one has sent you an interest yet. Make sure your profile is complete and engaging!"
              )
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            {sentInterests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {sentInterests.map((interest) => renderInterestItem(interest, "sent"))}
              </div>
            ) : (
              renderEmptyState(
                "sent",
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />,
                "You haven't sent any interests yet. Start browsing and connecting with other players!"
              )
            )}
          </TabsContent>

          <TabsContent value="accepted" className="mt-0">
            {acceptedInterests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {acceptedInterests.map((interest) => renderInterestItem(interest, "accepted"))}
              </div>
            ) : (
              renderEmptyState(
                "accepted",
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />,
                "No accepted connections yet. Keep sending interests to find your perfect sports partners!"
              )
            )}
          </TabsContent>

          <TabsContent value="declined" className="mt-0">
            {declinedInterests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {declinedInterests.map((interest) => renderInterestItem(interest, "declined"))}
              </div>
            ) : (
              renderEmptyState(
                "declined",
                <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />,
                "No declined interests. That's great - keep up the positive connections!"
              )
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
