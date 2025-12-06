import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  saving?: boolean;
  saved?: boolean;
  className?: string;
}

export function SaveIndicator({ saving, saved, className }: SaveIndicatorProps) {
  if (!saving && !saved) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-all duration-300",
        saving ? "text-muted-foreground" : "text-green-600",
        className
      )}
    >
      {saving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Salvando...</span>
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          <span>Alterações salvas</span>
        </>
      )}
    </div>
  );
}
