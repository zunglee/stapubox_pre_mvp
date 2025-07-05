import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth, authManager } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/constants";

export default function InterestsOverview() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  // Fetch all interest data
  const { data: receivedData } = useQuery({
    queryKey: [API_ENDPOINTS.INTERESTS.RECEIVED],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.INTERESTS.RECEIVED, {
        headers: authManager.getAuthHeaders(),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch received interests");
      return response.json();
    },
    enabled: isAuthenticated
  });

  const { data: sentData } = useQuery({
    queryKey: [API_ENDPOINTS.INTERESTS.SENT],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.INTERESTS.SENT, {
        headers: authManager.getAuthHeaders(),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch sent interests");
      return response.json();
    },
    enabled: isAuthenticated
  });

  const receivedInterests = receivedData?.interests || [];
  const sentInterests = sentData?.interests || [];

  // Group interests by status (same logic as interests page)
  const acceptedInterests = [
    ...receivedInterests.filter((i: any) => i.status === 'accepted'),
    ...sentInterests.filter((i: any) => i.status === 'accepted')
  ];
  
  const declinedInterests = [
    ...receivedInterests.filter((i: any) => i.status === 'declined'),
    ...sentInterests.filter((i: any) => i.status === 'declined')
  ];

  const pendingReceived = receivedInterests.filter((i: any) => i.status === 'pending');
  const pendingSent = sentInterests.filter((i: any) => i.status === 'pending');

  // Calculate new/unread counts based on last visit times
  const getLastVisitTime = (bucket: string): number => {
    try {
      const stored = localStorage.getItem(`stapubox_interests_last_visit_${bucket}`);
      return stored ? parseInt(stored) : 0;
    } catch (error) {
      return 0;
    }
  };

  const updateLastVisitTime = (bucket: string) => {
    try {
      localStorage.setItem(`stapubox_interests_last_visit_${bucket}`, Date.now().toString());
    } catch (error) {
      console.error('Error updating last visit time:', error);
    }
  };

  // Check if there are new items since last visit
  const lastReceivedVisit = getLastVisitTime('received');
  const lastAcceptedVisit = getLastVisitTime('accepted');
  
  const hasNewReceived = pendingReceived.length > 0 && 
    pendingReceived.some((interest: any) => {
      const createdTime = new Date(interest.createdAt).getTime();
      return createdTime > lastReceivedVisit;
    });
  
  const hasNewAccepted = acceptedInterests.length > 0 && 
    acceptedInterests.some((interest: any) => {
      const updatedTime = new Date(interest.updatedAt || interest.createdAt).getTime();
      return updatedTime > lastAcceptedVisit;
    });

  // Force notification reset for new interests (temporary for testing)
  // If user has pending received interests but no red dot, reset the timestamp
  const shouldShowReceivedNotification = pendingReceived.length > 0 && 
    (lastReceivedVisit === 0 || pendingReceived.some((interest: any) => {
      const createdTime = new Date(interest.createdAt).getTime();
      return createdTime > lastReceivedVisit;
    }));
  
  const shouldShowAcceptedNotification = acceptedInterests.length > 0 && 
    (lastAcceptedVisit === 0 || acceptedInterests.some((interest: any) => {
      const updatedTime = new Date(interest.updatedAt || interest.createdAt).getTime();
      return updatedTime > lastAcceptedVisit;
    }));

  // Debug logging for notification system
  if (pendingReceived.length > 0) {
    console.log('🔔 Notification Debug - Pending received interests:', pendingReceived.length);
    console.log('🔔 Last received visit time:', new Date(lastReceivedVisit));
    console.log('🔔 Should show notification:', shouldShowReceivedNotification);
  }
  
  if (acceptedInterests.length > 0) {
    console.log('🔔 Notification Debug - Accepted interests:', acceptedInterests.length);
    console.log('🔔 Last accepted visit time:', new Date(lastAcceptedVisit));
    console.log('🔔 Should show accepted notification:', shouldShowAcceptedNotification);
  }

  const handleBucketClick = (bucket: string) => {
    // Update last visit time when user actually clicks on the bucket
    updateLastVisitTime(bucket);
    navigate(`/interests?tab=${bucket}`);
  };

  // Clear notifications when user clicks on interests center button
  const handleCenterClick = () => {
    // Update visit times for all buckets to clear any notifications
    updateLastVisitTime('received');
    updateLastVisitTime('accepted');
    navigate("/interests");
  };



  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="text-center">
          {/* Central Interests Icon with Text */}
          <div className="flex justify-center items-center space-x-2 mb-6">
            <Button
              onClick={handleCenterClick}
              variant="ghost"
              className="flex items-center space-x-2 p-4 hover:bg-blue-50 transition-colors rounded-lg"
            >
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Interests</span>
            </Button>
          </div>

          {/* Interests Buckets */}
          <div className="grid grid-cols-4 gap-4">
            {/* Received Bucket */}
            <Button
              variant="ghost"
              onClick={() => handleBucketClick("received")}
              className="flex flex-col items-center p-4 h-auto space-y-2 hover:bg-blue-50 transition-colors relative"
            >
              <span className="text-xs font-medium text-gray-700">Received</span>
              <Badge className="bg-blue-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                {pendingReceived.length}
              </Badge>
              {/* Notification indicator for new received interests */}
              {shouldShowReceivedNotification && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </Button>

            {/* Sent Bucket */}
            <Button
              variant="ghost"
              onClick={() => handleBucketClick("sent")}
              className="flex flex-col items-center p-4 h-auto space-y-2 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">Sent</span>
              <Badge className="bg-gray-200 text-gray-600 text-xs min-w-[20px] h-5 flex items-center justify-center">
                {pendingSent.length}
              </Badge>
            </Button>

            {/* Accepted Bucket */}
            <Button
              variant="ghost"
              onClick={() => handleBucketClick("accepted")}
              className="flex flex-col items-center p-4 h-auto space-y-2 hover:bg-green-50 transition-colors relative"
            >
              <span className="text-xs font-medium text-gray-700">Accepted</span>
              <Badge className="bg-green-100 text-green-600 text-xs min-w-[20px] h-5 flex items-center justify-center">
                {acceptedInterests.length}
              </Badge>
              {/* Notification indicator for new accepted interests */}
              {shouldShowAcceptedNotification && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </Button>

            {/* Declined Bucket */}
            <Button
              variant="ghost"
              onClick={() => handleBucketClick("declined")}
              className="flex flex-col items-center p-4 h-auto space-y-2 hover:bg-red-50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">Declined</span>
              <Badge className="bg-red-100 text-red-600 text-xs min-w-[20px] h-5 flex items-center justify-center">
                {declinedInterests.length}
              </Badge>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}