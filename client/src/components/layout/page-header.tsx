import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export default function PageHeader({ title, showBackButton = true }: PageHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>
    </div>
  );
}