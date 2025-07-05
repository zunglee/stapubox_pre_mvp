import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageCircle, X } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  onShare?: () => void;
}

export function ShareModal({ isOpen, onClose, title, url, onShare }: ShareModalProps) {
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to clipboard",
      });
      if (onShare) onShare();
      onClose();
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Link copied!",
        description: "Article link has been copied to clipboard",
      });
      if (onShare) onShare();
      onClose();
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this article on StapuBuzz: ${url}`)}`;
    window.open(whatsappUrl, '_blank');
    if (onShare) onShare();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Share Article
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-0 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Share "{title}" with others
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          
          <div className="space-y-3">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
            >
              <Copy className="h-5 w-5 text-gray-600" />
              <span>Copy Link</span>
            </Button>
            
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-green-600 border-green-200 hover:bg-green-50"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
              <span>Share via WhatsApp</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}