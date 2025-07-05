import { cn } from "@/lib/utils";

interface SkillLevelIndicatorProps {
  skillLevel: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SKILL_LEVELS = {
  "beginner": { label: "Beginner", color: "#FDCC00", squares: 1 },
  "learner": { label: "Learner", color: "#0C61FB", squares: 2 },
  "intermediate": { label: "Intermediate", color: "#26B34F", squares: 3 },
  "advanced": { label: "Advanced", color: "#FE8F00", squares: 4 },
  "expert": { label: "Expert", color: "#AA30AA", squares: 5 }
};

const SIZES = {
  sm: "w-2 h-2",
  md: "w-3 h-3", 
  lg: "w-4 h-4"
};

export function SkillLevelIndicator({ 
  skillLevel, 
  size = "md", 
  className 
}: SkillLevelIndicatorProps) {
  const level = SKILL_LEVELS[skillLevel.toLowerCase() as keyof typeof SKILL_LEVELS];
  
  if (!level) {
    return (
      <span className={cn("text-sm text-gray-500", className)}>
        {skillLevel}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex gap-0.5">
        {Array.from({ length: level.squares }).map((_, index) => (
          <div
            key={index}
            className={cn(SIZES[size], "rounded-sm border border-gray-300")}
            style={{ backgroundColor: level.color }}
          />
        ))}
        {Array.from({ length: 5 - level.squares }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className={cn(SIZES[size], "rounded-sm border border-gray-300 bg-gray-100")}
          />
        ))}
      </div>
      <span className="text-xs text-gray-600 ml-1">
        {level.label}
      </span>
    </div>
  );
}