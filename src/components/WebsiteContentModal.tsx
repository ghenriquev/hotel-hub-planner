import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WebsitePage {
  url: string;
  title?: string;
  description?: string;
  text?: string;
}

interface WebsiteContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: WebsitePage[];
  crawledAt: string | null;
}

export function WebsiteContentModal({ 
  open, 
  onOpenChange, 
  pages, 
  crawledAt 
}: WebsiteContentModalProps) {
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([0]));
  const [copied, setCopied] = useState(false);

  const togglePage = (index: number) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPages(newExpanded);
  };

  const totalWords = pages.reduce((acc, page) => {
    return acc + (page.text?.split(/\s+/).length || 0);
  }, 0);

  const copyAllContent = () => {
    const allContent = pages.map(page => {
      return `# ${page.title || 'Sem título'}
URL: ${page.url}
${page.description ? `Descrição: ${page.description}` : ''}

${page.text || ''}
---`;
    }).join('\n\n');

    navigator.clipboard.writeText(allContent);
    setCopied(true);
    toast.success("Conteúdo copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Conteúdo Extraído do Site
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <span>{pages.length} páginas</span>
            <span>•</span>
            <span>{totalWords.toLocaleString('pt-BR')} palavras</span>
            {crawledAt && (
              <>
                <span>•</span>
                <span>
                  Analisado em {format(parseISO(crawledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyAllContent}
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

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-2 py-2">
            {pages.map((page, index) => {
              const isExpanded = expandedPages.has(index);
              return (
                <div 
                  key={index} 
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => togglePage(index)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {page.title || 'Sem título'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {page.url}
                      </div>
                    </div>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-primary/10 rounded transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20">
                      {page.description && (
                        <div className="mb-3 mt-3">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Descrição
                          </div>
                          <p className="text-sm text-foreground">
                            {page.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Conteúdo
                        </div>
                        <div className={cn(
                          "text-sm text-foreground bg-background border border-border rounded-lg p-4",
                          "max-h-80 overflow-y-auto whitespace-pre-wrap"
                        )}>
                          {page.text || 'Nenhum conteúdo de texto extraído'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
