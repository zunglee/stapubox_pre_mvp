import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";

interface PendingInterest {
  receiverId: number;
  receiverName: string;
}

export function usePendingInterest() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const sendInterestMutation = useMutation({
    mutationFn: async (pendingInterest: PendingInterest) => {
      const response = await apiRequest("POST", API_ENDPOINTS.INTERESTS.SEND, {
        receiverId: pendingInterest.receiverId
      });
      return { ...response, receiverName: pendingInterest.receiverName };
    },
    onSuccess: (data) => {
      // Clear pending interest from storage
      localStorage.removeItem("pendingInterest");
      
      // Show success toast
      toast({
        title: "Interest Sent Successfully",
        description: `Your interest has been sent to ${data.receiverName}!`
      });
    },
    onError: (error: any) => {
      console.error("Failed to send pending interest:", error);
      toast({
        title: "Failed to Send Interest",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Check for pending interest
      const pendingInterestData = localStorage.getItem("pendingInterest");
      if (pendingInterestData) {
        try {
          const pendingInterest: PendingInterest = JSON.parse(pendingInterestData);
          // Automatically send the pending interest
          sendInterestMutation.mutate(pendingInterest);
        } catch (error) {
          console.error("Failed to parse pending interest:", error);
          localStorage.removeItem("pendingInterest");
        }
      }
    }
  }, [isAuthenticated]);

  return {
    isProcessingPendingInterest: sendInterestMutation.isPending
  };
}