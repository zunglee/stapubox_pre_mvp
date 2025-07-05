import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Heart, Share2, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedItemProps {
  item: any;
  onLikeToggle: () => void;
  isAuthenticated: boolean;
}

export default function FeedItem({ item, onLikeToggle, isAuthenticated }: FeedItemProps) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", API_ENDPOINTS.FEED.LIKE(item.id));
    },
    onSuccess: (response) => {
      const result = response.json();
      const newIsLiked = result.isLiked;
      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
      onLikeToggle();
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to like articles",
        variant: "destructive"
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.excerpt,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled the share
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${item.title}\n\n${item.excerpt}\n\nRead more on StapuBox`)}`;
      window.open(shareUrl, '_blank');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Cricket': 'bg-blue-600',
      'Football': 'bg-green-600',
      'Badminton': 'bg-red-600',
      'Tennis': 'bg-yellow-600',
      'Basketball': 'bg-orange-600',
      'default': 'bg-gray-600'
    };
    return colors[category] || colors.default;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Featured Image */}
      {item.imageUrl && (
        <div className="relative h-64 overflow-hidden">
          <img 
            src={item.imageUrl} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge className={`${getCategoryColor(item.category)} text-white`}>
              {item.category}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-6">
        {/* Header with category and time */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
          {!item.imageUrl && (
            <Badge className={`${getCategoryColor(item.category)} text-white`}>
              {item.category}
            </Badge>
          )}
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(item.publishedAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {item.title}
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {item.excerpt}
        </p>

        {/* Engagement Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`p-0 h-auto ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart 
                className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} 
              />
              <span className="font-medium">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-0 h-auto text-gray-500 hover:text-blue-500"
            >
              <Share2 className="w-5 h-5 mr-2" />
              <span>Share</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
          >
            Read More
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
