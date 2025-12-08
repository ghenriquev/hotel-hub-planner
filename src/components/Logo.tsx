import { cn } from "@/lib/utils";
import reprotelLogo from "@/assets/reprotel-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={reprotelLogo} 
        alt="Reprotel Marketing Hoteleiro" 
        className={cn(sizes[size], "w-auto")}
      />
    </div>
  );
}
