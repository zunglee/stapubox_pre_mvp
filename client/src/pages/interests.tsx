import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, authManager } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/constants";
import { queryClient } from "@/lib/queryClient";
import InterestTabs from "@/components/interests/interest-tabs";
import PageHeader from "@/components/layout/page-header";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Interests() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [initialTab, setInitialTab] = useState<string | null>(null);

  // Check URL parameters for deeplink navigation and mark as visited
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['received', 'sent', 'accepted', 'declined'].includes(tabParam)) {
      setInitialTab(tabParam);
      // Mark this tab as visited to clear notifications
      try {
        localStorage.setItem(`stapubox_interests_last_visit_${tabParam}`, Date.now().toString());
      } catch (error) {
        console.error('Error updating last visit time:', error);
      }
    }
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const { data: receivedData, isLoading: receivedLoading, refetch: refetchReceived } = useQuery({
    queryKey: [API_ENDPOINTS.INTERESTS.RECEIVED],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.INTERESTS.RECEIVED, {
        headers: authManager.getAuthHeaders(),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch received interests");
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0 // Always refetch when component mounts
  });

  const { data: sentData, isLoading: sentLoading, refetch: refetchSent } = useQuery({
    queryKey: [API_ENDPOINTS.INTERESTS.SENT],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.INTERESTS.SENT, {
        headers: authManager.getAuthHeaders(),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch sent interests");
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0 // Always refetch when component mounts
  });

  const isLoading = receivedLoading || sentLoading;
  const receivedInterests = receivedData?.interests || [];
  const sentInterests = sentData?.interests || [];
  
  // Group interests by status
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

  const refetchAll = async () => {
    // Invalidate all relevant caches for real-time updates
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/interests/received"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/interests/sent"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] })
    ]);
    
    refetchReceived();
    refetchSent();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Interests" />
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-12 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Interests" />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Manage Your Interests</h1>
            <p className="text-gray-600 text-lg">
              Track sent and received interests, and manage your connections.
            </p>
          </div>

          <InterestTabs
            receivedInterests={pendingReceived}
            sentInterests={pendingSent}
            acceptedInterests={acceptedInterests}
            declinedInterests={declinedInterests}
            onInterestUpdate={refetchAll}
            initialTab={initialTab}
          />
        </div>
      </div>
    </div>
  );
}