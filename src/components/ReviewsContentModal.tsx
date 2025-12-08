import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Star, 
  Copy, 
  Check, 
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReviewsContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  lastUpdated: string | null;
}

export function ReviewsContentModal({ 
  open, 
  onOpenChange, 
  content, 
  lastUpdated 
}: ReviewsContentModalProps) {
  const [copied, setCopied] = useState(false);

  const wordCount = content?.split(/\s+/).filter(Boolean).length || 0;
  
  // Count reviews by looking for the pattern "Avaliação X:"
  const reviewCount = (content?.match(/Avaliação \d+:/g) || []).length;

  const copyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Conteúdo copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Avaliações Consolidadas
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <span>{reviewCount} avaliações</span>
            <span>•</span>
            <span>{wordCount.toLocaleString('pt-BR')} palavras</span>
            {lastUpdated && (
              <>
                <span>•</span>
                <span>
                  Gerado em {format(parseISO(lastUpdated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyContent}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Tudo
              </>
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 bg-muted/20 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Documento usado pelos agentes de IA
              </span>
            </div>
            <div className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
              {content || 'Nenhum conteúdo disponível'}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
