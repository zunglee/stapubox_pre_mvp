import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

export function usePendingInterests() {
  const { isAuthenticated } = useAuth();

  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['/api/interests/pending-count'],
    queryFn: async () => {
      const response = await fetch('/api/interests/pending-count', {
        credentials: 'include'
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data.count || 0;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return { pendingCount };
}