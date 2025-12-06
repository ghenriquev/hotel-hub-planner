import { cn } from "@/lib/utils";

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
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative", sizes[size])}>
        <div className="absolute inset-0 gradient-primary rounded-lg opacity-90" />
        <div className="relative h-full aspect-square flex items-center justify-center">
          <span className="text-primary-foreground font-display font-bold text-lg">R</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-display font-semibold text-foreground leading-tight">
          Reprotel
        </span>
        <span className="text-xs text-muted-foreground leading-tight">
          Marketing Hoteleiro
        </span>
      </div>
    </div>
  );
}
