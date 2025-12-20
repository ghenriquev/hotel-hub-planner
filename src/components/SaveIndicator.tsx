import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveIndicatorProps {
  status?: SaveStatus;
  // Legacy props for backwards compatibility
  saving?: boolean;
  saved?: boolean;
  className?: string;
}

export function SaveIndicator({ status, saving, saved, className }: SaveIndicatorProps) {
  // Support legacy props
  const resolvedStatus: SaveStatus = status ?? (saving ? 'saving' : saved ? 'saved' : 'idle');
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm transition-all duration-300",
      className
    )}>
      {resolvedStatus === 'idle' && (
        <>
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground hidden sm:inline">Salvamento automático</span>
        </>
      )}
      
      {resolvedStatus === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-primary">Salvando...</span>
        </>
      )}
      
      {resolvedStatus === 'saved' && (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Salvo</span>
        </>
      )}
      
      {resolvedStatus === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Erro ao salvar</span>
        </>
      )}
    </div>
  );
}
